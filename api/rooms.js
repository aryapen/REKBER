import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: "thr-49.h.filess.io",
  user: "room_bottlesea",
  password: "f09cf68286cbcbba65e8c8874450d82c1472af53",
  database: "room_bottlesea",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Buka CORS selebar-lebarnya agar admin.html leluasa
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Amankan request OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- JALUR GET (AMBIL DATA) ---
  if (req.method === 'GET') {
    try {
      // Ambil data dari database
      const [rows] = await pool.query('SELECT * FROM rooms');
      
      // Kirim balik ke frontend, pastikan formatnya array JSON
      return res.status(200).json(rows);
    } catch (dbError) {
      // Jika database bermasalah (misal tabel salah), gagalkan dengan anggun
      // Kita kirim status 200 dengan info error di dalamnya agar Vercel tidak melempar Error 500 blanket!
      return res.status(200).json([
        {
          id: 999,
          roomCode: "DB-ERROR",
          game: dbError.message.substring(0, 30),
          price: 0,
          status: "FAILED"
        }
      ]);
    }
  }

  // --- JALUR POST (BUAT DATA) ---
  if (req.method === 'POST') {
    try {
      const data = req.body;
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
      return res.status(201).json({ success: true, message: `Sukses Menerbitkan Token Baru: ${data.roomCode}` });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ message: "Method tidak diizinkan" });
}