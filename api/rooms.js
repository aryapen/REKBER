import mysql from 'mysql2/promise'; // Gunakan versi promise agar rapi

// 1. Inisialisasi Pool (Batasi maksimal 2-3 koneksi saja agar tidak menyentuh limit 5 di Filess.io)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 3, // KUNCI UTAMA: Batasi koneksi untuk Free Tier Filess.io!
  queueLimit: 0
});

export default async function handler(req, res) {
  // Tambahkan CORS Header agar admin.html bisa akses jika beda domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // === PROSES POST (TERBITKAN TOKEN BARU) ===
  if (req.method === 'POST') {
    try {
      const { roomCode, game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller } = req.body;

      // Konversi price menjadi Angka (Integer) agar tidak ditolak MySQL jika tipe kolomnya INT
      const numericPrice = parseInt(price) || 0;

      // Jalankan Query INSERT
      const [result] = await pool.query(
        `INSERT INTO rooms (roomCode, game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [roomCode, game, numericPrice, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller]
      );

      return res.status(200).json({ success: true, id: result.insertId });

    } catch (error) {
      console.error("MySQL Error:", error);
      // Mengembalikan pesan error asli ke frontend agar mudah dilacak di Network Tab
      return res.status(500).json({ error: error.message });
    }
  }

  // === PROSES GET (BACA DATA UNTUK TABEL) ===
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query('SELECT * FROM rooms ORDER BY id DESC');
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method tidak diizinkan' });
}