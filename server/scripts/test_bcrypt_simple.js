import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function testBcrypt() {
  try {
    const hash = await bcrypt.hash("123456", 10);
    console.log("Hash:", hash);
    const match = await bcrypt.compare("123456", hash);
    console.log("Match:", match);
  } catch (err) {
    console.error("Error:", err);
  }
}
testBcrypt();
