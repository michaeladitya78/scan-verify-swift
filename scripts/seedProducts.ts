import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCeXmJIw-oMOVccq33_1Nj3tjdkSOuN7jk",
  authDomain: "scan-verify.firebaseapp.com",
  projectId: "scan-verify",
  storageBucket: "scan-verify.firebasestorage.app",
  messagingSenderId: "141675485557",
  appId: "1:141675485557:web:87be6576736094f7801b3c",
  measurementId: "G-6DRK8X2TZ9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BRANDS = ['Samsung', 'Apple', 'LG', 'Sony', 'Xiaomi', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Nokia'];
const COUNTRIES = ['China', 'India', 'Vietnam', 'South Korea', 'Japan', 'Taiwan', 'Malaysia', 'Thailand'];
const HSN_CODES = [
  { code: '85171290', description: 'Mobile Phones' },
  { code: '85176990', description: 'Communication Equipment' },
  { code: '85176290', description: 'Network Devices' },
  { code: '85177090', description: 'Electronic Components' },
  { code: '85176930', description: 'Wireless Devices' }
];

function generateRandomSerial() {
  const prefix = ['SM', 'AP', 'LG', 'SN', 'MI', 'OP', 'RX', 'VV'][Math.floor(Math.random() * 8)];
  const numbers = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${numbers}`;
}

function generateRandomProduct() {
  const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
  const hsnEntry = HSN_CODES[Math.floor(Math.random() * HSN_CODES.length)];
  const serial_number = generateRandomSerial();
  const model_number = `${brand}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  return {
    serial_number,
    hsn_code: hsnEntry.code,
    brand,
    model_number,
    product_description: `${brand} ${hsnEntry.description} - ${model_number}`,
    declared_value: Math.floor(Math.random() * (150000 - 10000) + 10000),
    country_of_origin: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    barcode: Math.random().toString().slice(2, 15),
    product_category: hsnEntry.description,
    created_at: new Date().toISOString()
  };
}

async function seedProducts() {
  console.log('Starting product seeding...');
  const productsCollection = collection(db, 'products');
  const products = Array.from({ length: 1000 }, generateRandomProduct);
  
  for (const product of products) {
    try {
      await addDoc(productsCollection, product);
      console.log(`Added product: ${product.serial_number}`);
    } catch (error) {
      console.error(`Failed to add product: ${product.serial_number}`, error);
    }
  }
  
  console.log('Product seeding completed!');
}

seedProducts().catch(console.error);