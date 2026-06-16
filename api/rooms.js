import mysql from 'mysql2/promise';

// Konfigurasi koneksi langsung menggunakan pool agar ramah lingkungan Serverless
const pool = mysql.createPool({
  host: "thr-49.h.filess.io",
  user: "room_bottlesea",
  password: "f09cf68286cbcbba65e8c8874450d82c1472af53",
  database: "room_bottlesea",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

export default async function handler(req, res) {
  // Mengaktifkan CORS agar bisa diakses oleh admin.html kamu
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request untuk CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Jalankan query ke database filess.io kamu
    // Ganti 'nama_tabel_kamu' dengan nama tabel asli yang ada di database-mu (misal: rooms atau transaksi)
    const [rows] = await pool.query('SELECT * FROM nama_tabel_kamu'); 
    
    // Kembalikan data hasil database ke frontend admin.html
    return res.status(200).json(rows);
  } catch (error) {
    // Jika koneksi gagal atau query salah, errornya akan tampil di browser (tidak langsung 500 polosan)
    return res.status(500).json({ 
      success: false, 
      message: "Gagal menyambung ke filess.io", 
      error: error.message 
    });
  }
}