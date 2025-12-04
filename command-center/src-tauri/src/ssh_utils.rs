use ssh2::Session;
use std::net::TcpStream;
use std::io::Read;
use std::fs::File;
use std::io::Write;
use ssh_key::{rand_core::OsRng, PrivateKey, LineEnding};
use std::path::PathBuf;

pub struct SshKeypair {
    pub private_key: String, // PEM format (OpenSSH)
    pub public_key: String, // OpenSSH format
}

pub fn generate_ephemeral_keypair() -> Result<SshKeypair, String> {
    // Generate Ed25519 keypair
    let key = PrivateKey::random(&mut OsRng, ssh_key::Algorithm::Ed25519)
        .map_err(|e| e.to_string())?;

    // Export private key to OpenSSH PEM format
    let private_pem = key.to_openssh(LineEnding::LF).map_err(|e| e.to_string())?;

    // Export public key to OpenSSH format
    let public_key = key.public_key().to_openssh().map_err(|e| e.to_string())?;

    Ok(SshKeypair {
        private_key: private_pem.to_string(),
        public_key: public_key,
    })
}

// Helper struct to ensure files are deleted when dropped
struct TempFileGuard {
    path: PathBuf,
}

impl Drop for TempFileGuard {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.path);
    }
}

pub fn execute_ssh_command(
    host: &str,
    port: u16,
    username: &str,
    private_key_pem: &str,
    public_key_openssh: &str,
    command: &str
) -> Result<(i32, String), String> {
    // If we are in a mock environment (e.g., CI or Sandbox without real remote), we can skip connection
    if host == "mock_host" {
        println!("MOCK SSH: Executing '{}' on {}:{}", command, host, port);
        return Ok((0, "Mock execution success".to_string()));
    }

    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().map_err(|e| e.to_string())?;
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    // Android-compatible: Write keys to temporary files because ssh2 userauth_pubkey_memory is tricky/unstable
    let temp_dir = std::env::temp_dir();
    let id = uuid::Uuid::new_v4();
    let priv_path = temp_dir.join(format!("id_ed25519_{}", id));
    let pub_path = temp_dir.join(format!("id_ed25519_{}.pub", id));

    // Create guards immediately so files are deleted on return/panic
    let _priv_guard = TempFileGuard { path: priv_path.clone() };
    let _pub_guard = TempFileGuard { path: pub_path.clone() };

    {
        let mut priv_file = File::create(&priv_path).map_err(|e| e.to_string())?;
        priv_file.write_all(private_key_pem.as_bytes()).map_err(|e| e.to_string())?;
        
        // Ensure strictly private permissions (Unix only)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = priv_file.metadata().map_err(|e| e.to_string())?.permissions();
            perms.set_mode(0o600);
            priv_file.set_permissions(perms).map_err(|e| e.to_string())?;
        }

        let mut pub_file = File::create(&pub_path).map_err(|e| e.to_string())?;
        pub_file.write_all(public_key_openssh.as_bytes()).map_err(|e| e.to_string())?;
    }

    let auth_res = sess.userauth_pubkey_file(
        username, 
        Some(&pub_path), 
        &priv_path, 
        None
    );

    // Files are deleted here due to Drop, but auth_res is already evaluated
    // Note: ssh2 might need files to exist during the call, which they do.

    auth_res.map_err(|e| e.to_string())?;

    let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
    channel.exec(command).map_err(|e| e.to_string())?;

    let mut s = String::new();
    channel.read_to_string(&mut s).map_err(|e| e.to_string())?;
    channel.wait_close().map_err(|e| e.to_string())?;

    let exit_status = channel.exit_status().map_err(|e| e.to_string())?;

    Ok((exit_status, s))
}
