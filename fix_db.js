import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const app = initializeApp(config.firebaseConfig);
  const db = getFirestore(app);
  
  async function run() {
    const evSnap = await getDocs(collection(db, "events"));
    console.log("Current events:");
    evSnap.docs.forEach(d => {
       const data = d.data();
       console.log(`ID: ${d.id}, Pos: ${data.position}, Title: ${data.titleAr} / ${data.titleEn}`);
    });
  }
  run();
}
