import mysql from 'mysql2/promise';

// Konfigurasi koneksi menggunakan Pool agar tidak mudah putus/timeout di Vercel
const pool = mysql.createPool({
  host: "thr-49.h.filess.io",
  user: "room_bottlesea",
  password: "f09cf68286cbcbba65e8c8874450d82c1472af53",
  database: "room_bottlesea",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false } // Mengatasi masalah SSL sertifikat pada database gratisan
});

export default async function handler(req, res) {
  // Mengaktifkan CORS agar file admin.html kamu diizinkan mengakses API ini
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle Preflight Request dari browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ==========================================
  // 1. FUNGSI AMBIL DATA TABEL (GET /api/rooms)
  // ==========================================
  if (req.method === 'GET') {
    try {
      // Mengambil semua data dari tabel 'rooms'
      const [rows] = await pool.query('SELECT * FROM rooms');
      
      // Jika berhasil, kirimkan data berupa array JSON ke admin.html
      return res.status(200).json(rows);
    } catch (error) {
      // Jika kueri gagal, error asli dari database akan dikirim ke browser (bukan error 500 polos)
      return res.status(500).json({ 
        success: false, 
        message: "Gagal mengambil data dari database filess.io", 
        error: error.message 
      });
    }
  }

  // ==========================================
  // 2. FUNGSI BUAT TOKEN/ROOM BARU (POST /api/rooms)
  // ==========================================
  if (req.method === 'POST') {
    try {
      const data = req.body;
      
      // Susun kueri INSERT sesuai kolom yang dikirim dari admin.html kamu
      const querySql = `
        INSERT INTO rooms 
        (roomCode, game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        data.roomCode, data.game, data.price, data.buyer_wallet, 
        data.status, data.akun_id, data.akun_pass, data.akun_req, 
        data.loc_buyer, data.loc_seller
      ];

      await pool.query(querySql, params);
      
      return res.status(201).json({ 
        success: true, 
        message: `Sukses Menerbitkan Token Baru: ${data.roomCode || ''}` 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: "Gagal menyimpan room baru ke database", 
        error: error.message 
      });
    }
  }

  // Jika ada method selain GET atau POST yang masuk
  return res.status(405).json({ message: "Method Tidak Diizinkan" });
}