// use rand::rngs::OsRng;
// use ed25519_dalek::{SigningKey, VerifyingKey, Signer};
use ssh2::Session;
use std::net::TcpStream;
use std::io::Read;
// use base64;
use std::fs::File;
use std::io::Write;
use ssh_key::{PrivateKey, rand_core::OsRng, Algorithm};

pub struct SshKeypair {
    pub private_key: String, // PEM format
    pub public_key: String, // OpenSSH format
}

pub fn generate_ephemeral_keypair() -> Result<SshKeypair, String> {
    // Generate Ed25519 keypair using ssh-key
    let key = PrivateKey::random(&mut OsRng, Algorithm::Ed25519)
        .map_err(|e| e.to_string())?;

    let private_pem = key.to_openssh(ssh_key::LineEnding::LF)
        .map_err(|e| e.to_string())?
        .to_string();

    let public_key = key.public_key().to_openssh()
        .map_err(|e| e.to_string())?;

    Ok(SshKeypair {
        private_key: private_pem,
        public_key,
    })
}

pub fn execute_ssh_command(
    host: &str,
    port: u16,
    username: &str,
    private_key_pem: &str,
    public_key_openssh: &str, // ssh2 might need this or not
    command: &str
) -> Result<(i32, String), String> {
    if private_key_pem.contains("MOCK") {
        println!("MOCK SSH: Executing '{}' on {}:{}", command, host, port);
        return Ok((0, "Mock execution success".to_string()));
    }

    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().unwrap();
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    // Android-compatible: Write keys to temporary files
    // Use a unique filename to avoid collisions
    let temp_dir = std::env::temp_dir();
    let id = uuid::Uuid::new_v4();
    let priv_path = temp_dir.join(format!("id_ed25519_{}", id));
    let pub_path = temp_dir.join(format!("id_ed25519_{}.pub", id));

    // Ensure we clean up using a guard or try-finally block structure (via scope)
    // Here we use a manual cleanup in a defer-like style if possible, or just remove at end.
    // For robust cleanup, we could wrap this in a struct that impls Drop, but for this function,
    // we just ensure we try to remove them.

    {
        let mut priv_file = File::create(&priv_path).map_err(|e| e.to_string())?;
        priv_file.write_all(private_key_pem.as_bytes()).map_err(|e| e.to_string())?;
        
        let mut pub_file = File::create(&pub_path).map_err(|e| e.to_string())?;
        pub_file.write_all(public_key_openssh.as_bytes()).map_err(|e| e.to_string())?;
    }

    // Set permissions for private key if on unix (important for ssh, though ssh2 might be lenient)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&priv_path).map_err(|e| e.to_string())?.permissions();
        perms.set_mode(0o600);
        std::fs::set_permissions(&priv_path, perms).map_err(|e| e.to_string())?;
    }

    let auth_res = sess.userauth_pubkey_file(
        username, 
        Some(&pub_path), 
        &priv_path, 
        None
    );

    // Cleanup files immediately after auth attempt
    let _ = std::fs::remove_file(&priv_path);
    let _ = std::fs::remove_file(&pub_path);

    auth_res.map_err(|e| e.to_string())?;

    let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
    channel.exec(command).map_err(|e| e.to_string())?;

    let mut s = String::new();
    channel.read_to_string(&mut s).map_err(|e| e.to_string())?;
    channel.wait_close().map_err(|e| e.to_string())?;

    let exit_status = channel.exit_status().map_err(|e| e.to_string())?;

    Ok((exit_status, s))
}
