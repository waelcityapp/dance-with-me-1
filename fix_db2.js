import { initializeApp } from "firebase/app";
import { getFirestore, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const app = initializeApp(config);
  const db = getFirestore(app);
  
  async function run() {
    await deleteDoc(doc(db, "events", "ev-1784012958614"));
    await deleteDoc(doc(db, "events", "ev_vip_1784012511034"));
    await deleteDoc(doc(db, "events", "ev_vip_1784012958614"));
    console.log("Deleted 3 duplicates of the birthday ad at position 9.");
    process.exit(0);
  }
  run();
}
