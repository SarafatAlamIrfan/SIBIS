const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const Store = require('../models/Store');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sibis';

const categoriesMap = {
  grain: 'Grains & Staples',
  dairy: 'Dairy & Eggs',
  fresh: 'Fresh Produce & Meats',
  snack: 'Snacks & Beverages',
  personal: 'Personal Care',
  household: 'Household & Cleaning',
  baby: 'Baby Care',
  electronics: 'Home Electronics',
  stationery: 'Stationery'
};

const rawProductsList = [
  // 🌾 1. Food Staples & Dry Groceries (1–30)
  { name: 'Miniket Rice 5kg', cat: 'grain', brand: 'Chashi', pPrice: 320, sPrice: 370 },
  { name: 'Nazirshail Rice 5kg', cat: 'grain', brand: 'Chashi', pPrice: 360, sPrice: 420 },
  { name: 'Chinigura Rice (Aromatic) 1kg', cat: 'grain', brand: 'Pran', pPrice: 130, sPrice: 155 },
  { name: 'Red Lentils (Masoor Dal) 1kg', cat: 'grain', brand: 'General', pPrice: 110, sPrice: 130 },
  { name: 'Chickpeas (Chana) 1kg', cat: 'grain', brand: 'General', pPrice: 90, sPrice: 110 },
  { name: 'Yellow Split Peas (Anchor Dal) 1kg', cat: 'grain', brand: 'General', pPrice: 70, sPrice: 85 },
  { name: 'Whole Wheat Atta 2kg', cat: 'grain', brand: 'Fresh', pPrice: 110, sPrice: 130 },
  { name: 'Refined Flour (Maida) 1kg', cat: 'grain', brand: 'Teer', pPrice: 60, sPrice: 72 },
  { name: 'Semolina (Suji) 500g', cat: 'grain', brand: 'Fresh', pPrice: 35, sPrice: 45 },
  { name: 'Soybean Oil 5L', cat: 'grain', brand: 'Rupchanda', pPrice: 780, sPrice: 840 },
  { name: 'Mustard Oil (Shorishar Tel) 1L', cat: 'grain', brand: 'Radhuni', pPrice: 280, sPrice: 320 },
  { name: 'Pure Ghee 400g', cat: 'grain', brand: 'Aarong', pPrice: 580, sPrice: 650 },
  { name: 'Iodized Table Salt 1kg', cat: 'grain', brand: 'ACI', pPrice: 32, sPrice: 38 },
  { name: 'White Sugar 1kg', cat: 'grain', brand: 'Fresh', pPrice: 120, sPrice: 135 },
  { name: 'Red Sugar (Deshi) 1kg', cat: 'grain', brand: 'Lalcheeni', pPrice: 140, sPrice: 160 },
  { name: 'Turmeric Powder (Holud) 200g', cat: 'grain', brand: 'Radhuni', pPrice: 70, sPrice: 85 },
  { name: 'Chili Powder (Morich) 200g', cat: 'grain', brand: 'Radhuni', pPrice: 80, sPrice: 95 },
  { name: 'Coriander Powder (Dhunia) 200g', cat: 'grain', brand: 'Pran', pPrice: 60, sPrice: 75 },
  { name: 'Cumin Seeds (Jeera) 100g', cat: 'grain', brand: 'General', pPrice: 90, sPrice: 110 },
  { name: 'Garam Masala Powder 100g', cat: 'grain', brand: 'Radhuni', pPrice: 120, sPrice: 145 },
  { name: 'Radhuni Meat Curry Mix 40g', cat: 'grain', brand: 'Radhuni', pPrice: 35, sPrice: 45 },
  { name: 'Tehari / Biryani Spice Mix 40g', cat: 'grain', brand: 'Radhuni', pPrice: 40, sPrice: 50 },
  { name: 'Garlic Paste 200g', cat: 'grain', brand: 'Radhuni', pPrice: 75, sPrice: 90 },
  { name: 'Ginger Paste 200g', cat: 'grain', brand: 'Radhuni', pPrice: 85, sPrice: 105 },
  { name: 'Vermicelli (Shemai) 200g', cat: 'grain', brand: 'Bonful', pPrice: 30, sPrice: 40 },
  { name: 'Sago (Sabudana) 500g', cat: 'grain', brand: 'General', pPrice: 65, sPrice: 80 },
  { name: 'Mustard Paste (Kasundi) 300ml', cat: 'grain', brand: 'Pran', pPrice: 70, sPrice: 85 },
  { name: 'Black Pepper (Gol Morich) 50g', cat: 'grain', brand: 'General', pPrice: 80, sPrice: 100 },
  { name: 'Tamarind (Tetul) 250g', cat: 'grain', brand: 'General', pPrice: 45, sPrice: 60 },
  { name: 'Chia Seeds 250g', cat: 'grain', brand: 'Organik', pPrice: 280, sPrice: 350 },
  { name: 'Isabgol Husks (Bhusii) 100g', cat: 'grain', brand: 'General', pPrice: 140, sPrice: 170 },

  // 🥛 2. Dairy, Eggs & Refrigerated Goods (31–50)
  { name: 'Pasteurized Liquid Milk 1L', cat: 'dairy', brand: 'Aarong Dairy', pPrice: 80, sPrice: 90 },
  { name: 'Full-Cream Milk Powder 1kg', cat: 'dairy', brand: 'Dano', pPrice: 780, sPrice: 840 },
  { name: 'Farm Fresh Brown Eggs 12pcs', cat: 'dairy', brand: 'Eggo', pPrice: 125, sPrice: 145 },
  { name: 'Farm Fresh White Eggs 12pcs', cat: 'dairy', brand: 'Eggo', pPrice: 120, sPrice: 140 },
  { name: 'Salted Butter 200g', cat: 'dairy', brand: 'Aarong Dairy', pPrice: 210, sPrice: 240 },
  { name: 'Cheddar Cheese Slices 10pcs', cat: 'dairy', brand: 'Arla', pPrice: 240, sPrice: 280 },
  { name: 'Mozzarella Cheese 250g', cat: 'dairy', brand: 'Aarong', pPrice: 290, sPrice: 340 },
  { name: 'Plain Sweet Curd (Misti Doi) 500g', cat: 'dairy', brand: 'Bogura Doi', pPrice: 130, sPrice: 160 },
  { name: 'Sour Curd (Tok Doi) 500g', cat: 'dairy', brand: 'Aarong', pPrice: 110, sPrice: 135 },
  { name: 'Condensed Milk 397g', cat: 'dairy', brand: 'Starship', pPrice: 75, sPrice: 85 },
  { name: 'Dairy Cream 200ml', cat: 'dairy', brand: 'Anchor', pPrice: 160, sPrice: 190 },
  { name: 'Paneer 250g', cat: 'dairy', brand: 'Aarong Dairy', pPrice: 180, sPrice: 210 },
  { name: 'Flavored Milk (Chocolate) 200ml', cat: 'dairy', brand: 'Pran', pPrice: 25, sPrice: 30 },
  { name: 'Flavored Milk (Mango) 200ml', cat: 'dairy', brand: 'Pran', pPrice: 25, sPrice: 30 },
  { name: 'Laban 250ml', cat: 'dairy', brand: 'Aarong', pPrice: 40, sPrice: 50 },
  { name: 'Borhani Mix 1L', cat: 'dairy', brand: 'Bogura Borhani', pPrice: 120, sPrice: 150 },
  { name: 'Active Dry Yeast 100g', cat: 'dairy', brand: 'Saf-Instant', pPrice: 90, sPrice: 115 },
  { name: 'Vanilla Essence 28ml', cat: 'dairy', brand: 'Foster Clark', pPrice: 65, sPrice: 80 },
  { name: 'Margarine 250g', cat: 'dairy', brand: 'Astra', pPrice: 95, sPrice: 115 },
  { name: 'Probiotic Yogurt Drink 150ml', cat: 'dairy', brand: 'Yakult', pPrice: 40, sPrice: 50 },
  { name: 'Frozen Plain Paratha 10pcs', cat: 'dairy', brand: 'Kazi Farms', pPrice: 110, sPrice: 135 },
  { name: 'Frozen Samosa 10pcs', cat: 'dairy', brand: 'Golden Harvest', pPrice: 90, sPrice: 110 },
  { name: 'Frozen Singara 10pcs', cat: 'dairy', brand: 'Golden Harvest', pPrice: 85, sPrice: 105 },

  // 🍗 3. Fresh Produce & Meats (51–70)
  { name: 'Fresh Red Onions (Peyaj) 1kg', cat: 'fresh', brand: 'Local', pPrice: 60, sPrice: 75 },
  { name: 'Potatoes (Aloo) 1kg', cat: 'fresh', brand: 'Local', pPrice: 30, sPrice: 40 },
  { name: 'Fresh Tomatoes 1kg', cat: 'fresh', brand: 'Local', pPrice: 80, sPrice: 100 },
  { name: 'Green Chilies (Kacha Morich) 250g', cat: 'fresh', brand: 'Local', pPrice: 35, sPrice: 50 },
  { name: 'Lemons (Elachi Lebu) 4pcs', cat: 'fresh', brand: 'Local', pPrice: 20, sPrice: 30 },
  { name: 'Cucumbers 1kg', cat: 'fresh', brand: 'Local', pPrice: 40, sPrice: 55 },
  { name: 'Eggplants (Begun) 1kg', cat: 'fresh', brand: 'Local', pPrice: 50, sPrice: 65 },
  { name: 'Cauliflower 1pc', cat: 'fresh', brand: 'Local', pPrice: 35, sPrice: 45 },
  { name: 'Cabbage 1pc', cat: 'fresh', brand: 'Local', pPrice: 30, sPrice: 40 },
  { name: 'Spinach (Palong Shak) 1 bunch', cat: 'fresh', brand: 'Local', pPrice: 15, sPrice: 25 },
  { name: 'Fresh Bananas (Sagor) 12pcs', cat: 'fresh', brand: 'Local', pPrice: 90, sPrice: 110 },
  { name: 'Apples (Fuji) 1kg', cat: 'fresh', brand: 'Imported', pPrice: 240, sPrice: 280 },
  { name: 'Green Guavas 1kg', cat: 'fresh', brand: 'Local', pPrice: 70, sPrice: 90 },
  { name: 'Imported Oranges 1kg', cat: 'fresh', brand: 'Imported', pPrice: 220, sPrice: 260 },
  { name: 'Broiler Chicken (Whole) 1kg', cat: 'fresh', brand: 'Kazi Farms', pPrice: 165, sPrice: 190 },
  { name: 'Sonali Chicken 1kg', cat: 'fresh', brand: 'CP Chicken', pPrice: 270, sPrice: 310 },
  { name: 'Fresh Beef (Bone-in) 1kg', cat: 'fresh', brand: 'Bengal Meat', pPrice: 680, sPrice: 750 },
  { name: 'Mutton (Goat Meat) 1kg', cat: 'fresh', brand: 'Bengal Meat', pPrice: 950, sPrice: 1050 },
  { name: 'Fresh Rui Fish 1kg', cat: 'fresh', brand: 'Local', pPrice: 260, sPrice: 310 },
  { name: 'Katla Fish 1kg', cat: 'fresh', brand: 'Local', pPrice: 290, sPrice: 340 },
  { name: 'Frozen Prawns 500g', cat: 'fresh', brand: 'Bengal Meat', pPrice: 380, sPrice: 440 },

  // 🍪 4. Snacks, Bakery & Beverages (71–95)
  { name: 'Milk Bread 400g', cat: 'snack', brand: 'Bella Foods', pPrice: 65, sPrice: 80 },
  { name: 'Burger Bun 4pcs', cat: 'snack', brand: 'Bella Foods', pPrice: 40, sPrice: 50 },
  { name: 'Toast Biscuits 300g', cat: 'snack', brand: 'Elson', pPrice: 55, sPrice: 70 },
  { name: 'Chanachur (Ruchii) 300g', cat: 'snack', brand: 'Ruchii', pPrice: 65, sPrice: 80 },
  { name: 'Marie Biscuits 200g', cat: 'snack', brand: 'Olympic', pPrice: 35, sPrice: 45 },
  { name: 'Oreo Cream Biscuits 120g', cat: 'snack', brand: 'Oreo', pPrice: 70, sPrice: 85 },
  { name: 'Lexus Vegetable Crackers 240g', cat: 'snack', brand: 'Olympic', pPrice: 60, sPrice: 75 },
  { name: 'Lays Potato Chips 50g', cat: 'snack', brand: 'Lays', pPrice: 45, sPrice: 50 },
  { name: 'Kurkure Spicy Snacks 50g', cat: 'snack', brand: 'Kurkure', pPrice: 22, sPrice: 25 },
  { name: 'Instant Noodles (Maggie) 8-Pack', cat: 'snack', brand: 'Nestle', pPrice: 140, sPrice: 160 },
  { name: 'Korean Spicy Buldak Noodles', cat: 'snack', brand: 'Samyang', pPrice: 135, sPrice: 160 },
  { name: 'Macaroni Pasta 400g', cat: 'snack', brand: 'Cocoola', pPrice: 55, sPrice: 70 },
  { name: 'Black Tea Bags (Taaza) 100pcs', cat: 'snack', brand: 'Taaza', pPrice: 160, sPrice: 195 },
  { name: 'Green Tea Bags 50pcs', cat: 'snack', brand: 'Ispahani', pPrice: 120, sPrice: 145 },
  { name: 'Instant Coffee (Nescafe) 100g', cat: 'snack', brand: 'Nescafe', pPrice: 320, sPrice: 380 },
  { name: 'Coca-Cola 1.25L', cat: 'snack', brand: 'Coca-Cola', pPrice: 65, sPrice: 75 },
  { name: 'Sprite 1.25L', cat: 'snack', brand: 'Coca-Cola', pPrice: 65, sPrice: 75 },
  { name: 'Speed Energy Drink 250ml', cat: 'snack', brand: 'Akij', pPrice: 25, sPrice: 30 },
  { name: 'Orange Fruit Juice 1L', cat: 'snack', brand: 'Pran', pPrice: 110, sPrice: 130 },
  { name: 'Dairy Milk Chocolate 50g', cat: 'snack', brand: 'Cadbury', pPrice: 90, sPrice: 110 },
  { name: 'KitKat Chocolate 4-Finger', cat: 'snack', brand: 'Nestle', pPrice: 85, sPrice: 100 },
  { name: 'Candies Assorted 100pcs', cat: 'snack', brand: 'Pran', pPrice: 80, sPrice: 100 },
  { name: 'Roasted Peanuts 200g', cat: 'snack', brand: 'Pran', pPrice: 55, sPrice: 70 },
  { name: 'Imported Dates (Khejur) 500g', cat: 'snack', brand: 'Arabian', pPrice: 240, sPrice: 290 },
  { name: 'Choco Pops Cereals 350g', cat: 'snack', brand: 'Kelloggs', pPrice: 340, sPrice: 395 },

  // 🧼 5. Personal Care & Hygiene (96–125)
  { name: 'Lux Bath Soap 150g', cat: 'personal', brand: 'Unilever', pPrice: 65, sPrice: 75 },
  { name: 'Dettol Soap Active 150g', cat: 'personal', brand: 'Reckitt', pPrice: 68, sPrice: 80 },
  { name: 'Dove Cream Bar 135g', cat: 'personal', brand: 'Unilever', pPrice: 130, sPrice: 155 },
  { name: 'Head & Shoulders Shampoo 340ml', cat: 'personal', brand: 'P&G', pPrice: 320, sPrice: 375 },
  { name: 'Clear Men Anti-Dandruff 330ml', cat: 'personal', brand: 'Unilever', pPrice: 310, sPrice: 360 },
  { name: 'Hair Conditioner 180ml', cat: 'personal', brand: 'Sunsilk', pPrice: 180, sPrice: 215 },
  { name: 'Colgate Strong Teeth 200g', cat: 'personal', brand: 'Colgate', pPrice: 130, sPrice: 150 },
  { name: 'Pepsodent Germi Check 200g', cat: 'personal', brand: 'Unilever', pPrice: 120, sPrice: 140 },
  { name: 'Toothbrush Medium 1pc', cat: 'personal', brand: 'Oral-B', pPrice: 35, sPrice: 45 },
  { name: 'Listerine Mouthwash 250ml', cat: 'personal', brand: 'Listerine', pPrice: 240, sPrice: 280 },
  { name: 'Coconut Hair Oil 200ml', cat: 'personal', brand: 'Parachute', pPrice: 110, sPrice: 130 },
  { name: 'Olive Oil Skin Care 200ml', cat: 'personal', brand: 'Sasso', pPrice: 290, sPrice: 350 },
  { name: 'Himalaya Neem Face Wash 100ml', cat: 'personal', brand: 'Himalaya', pPrice: 160, sPrice: 190 },
  { name: 'Vaseline Cocoa Glow Lotion 400ml', cat: 'personal', brand: 'Unilever', pPrice: 360, sPrice: 420 },
  { name: 'Nivea Soft Cream 100ml', cat: 'personal', brand: 'Nivea', pPrice: 190, sPrice: 230 },
  { name: 'Pure Petroleum Jelly 50ml', cat: 'personal', brand: 'Vaseline', pPrice: 60, sPrice: 75 },
  { name: 'Ponds White Beauty Cream 50g', cat: 'personal', brand: 'Unilever', pPrice: 210, sPrice: 250 },
  { name: 'Sunscreen Lotion SPF 50 100ml', cat: 'personal', brand: 'Neutrogena', pPrice: 750, sPrice: 890 },
  { name: 'Axe Signature Body Spray 150ml', cat: 'personal', brand: 'Unilever', pPrice: 290, sPrice: 350 },
  { name: 'Al-Rehab Attar Perfume 6ml', cat: 'personal', brand: 'Al-Rehab', pPrice: 110, sPrice: 140 },
  { name: 'Whisper Ultra Clean Wings 8 Pads', cat: 'personal', brand: 'P&G', pPrice: 135, sPrice: 155 },
  { name: 'Joya Sanitary Pads 8pcs', cat: 'personal', brand: 'SMC', pPrice: 70, sPrice: 85 },
  { name: 'Liquid Hand Wash Refill 200ml', cat: 'personal', brand: 'Savlon', pPrice: 55, sPrice: 65 },
  { name: 'Hand Sanitizer Gel 50ml', cat: 'personal', brand: 'Savlon', pPrice: 40, sPrice: 50 },
  { name: 'Gillette Shaving Foam 200g', cat: 'personal', brand: 'Gillette', pPrice: 210, sPrice: 250 },
  { name: 'Razor Mach 3 Turbo 1pc', cat: 'personal', brand: 'Gillette', pPrice: 320, sPrice: 380 },
  { name: 'Mehendi Henna Tube 1pc', cat: 'personal', brand: 'Kaveri', pPrice: 45, sPrice: 55 },
  { name: 'Hair Gel Strong Hold 150ml', cat: 'personal', brand: 'Set Wet', pPrice: 95, sPrice: 120 },
  { name: 'Talcum Powder Fresh 100g', cat: 'personal', brand: 'Ponds', pPrice: 85, sPrice: 105 },
  { name: 'Wet Wipes Anti-Bacterial 40pcs', cat: 'personal', brand: 'Fay', pPrice: 90, sPrice: 115 },
  { name: 'Cotton Buds 100pcs', cat: 'personal', brand: 'Fay', pPrice: 30, sPrice: 40 },
  { name: 'Lip Ice Balm 1pc', cat: 'personal', brand: 'Lip Ice', pPrice: 110, sPrice: 130 },

  // 🧹 6. Household & Cleaning Supplies (126–150)
  { name: 'Surf Excel Washing Powder 1kg', cat: 'household', brand: 'Unilever', pPrice: 210, sPrice: 245 },
  { name: 'Wheel Laundry Soap 130g', cat: 'household', brand: 'Unilever', pPrice: 22, sPrice: 25 },
  { name: 'Vim Dishwashing Bar 300g', cat: 'household', brand: 'Unilever', pPrice: 35, sPrice: 40 },
  { name: 'Vim Dishwashing Liquid 250ml', cat: 'household', brand: 'Unilever', pPrice: 55, sPrice: 65 },
  { name: 'Comfort Fabric Conditioner 200ml', cat: 'household', brand: 'Unilever', pPrice: 95, sPrice: 115 },
  { name: 'Scrub Pads 2pcs', cat: 'household', brand: 'Vim', pPrice: 20, sPrice: 28 },
  { name: 'Harpic Toilet Cleaner 750ml', cat: 'household', brand: 'Reckitt', pPrice: 145, sPrice: 175 },
  { name: 'Lizol Floor Cleaner 500ml', cat: 'household', brand: 'Reckitt', pPrice: 120, sPrice: 145 },
  { name: 'Colin Glass Cleaner Spray 500ml', cat: 'household', brand: 'Reckitt', pPrice: 110, sPrice: 135 },
  { name: 'Toilet Paper Roll 4-Pack', cat: 'household', brand: 'Bashundhara', pPrice: 75, sPrice: 90 },
  { name: 'Facial Tissue Box 200 Sheet', cat: 'household', brand: 'Bashundhara', pPrice: 65, sPrice: 80 },
  { name: 'Kitchen Towel Roll 2-Pack', cat: 'household', brand: 'Bashundhara', pPrice: 85, sPrice: 105 },
  { name: 'Hit Mosquito Repellent 400ml', cat: 'household', brand: 'Godrej', pPrice: 290, sPrice: 340 },
  { name: 'Mosquito Coils 10pcs', cat: 'household', brand: 'Mortein', pPrice: 55, sPrice: 65 },
  { name: 'Air Freshener Spray 300ml', cat: 'household', brand: 'Fay', pPrice: 160, sPrice: 195 },
  { name: 'Naphthalene Balls 100g', cat: 'household', brand: 'General', pPrice: 45, sPrice: 60 },
  { name: 'Plastic Garbage Bags 10pcs', cat: 'household', brand: 'General', pPrice: 55, sPrice: 70 },
  { name: 'Broom (Phuljharu) 1pc', cat: 'household', brand: 'Local', pPrice: 60, sPrice: 80 },
  { name: 'Plastic Bucket 15L', cat: 'household', brand: 'RFL', pPrice: 180, sPrice: 220 },
  { name: 'Mop and Bucket Cleaning Set', cat: 'household', brand: 'RFL', pPrice: 850, sPrice: 990 },
  { name: 'Aluminum Foil Wrap 10m', cat: 'household', brand: 'General', pPrice: 120, sPrice: 150 },
  { name: 'Plastic Storage Container 3-Set', cat: 'household', brand: 'RFL', pPrice: 220, sPrice: 270 },
  { name: 'Plastic Clothes Hangers 6pcs', cat: 'household', brand: 'RFL', pPrice: 80, sPrice: 100 },
  { name: 'Bleaching Powder 500g', cat: 'household', brand: 'ACI', pPrice: 45, sPrice: 60 },
  { name: 'Drain Cleaner Powder 50g', cat: 'household', brand: 'Harpic', pPrice: 35, sPrice: 45 },

  // 👶 7. Baby Care & Kids (151–165)
  { name: 'Baby Disposable Diapers L 50pcs', cat: 'baby', brand: 'Huggies', pPrice: 850, sPrice: 990 },
  { name: 'Baby Wet Wipes 80pcs', cat: 'baby', brand: 'Bashundhara', pPrice: 110, sPrice: 135 },
  { name: 'Johnson Baby Shampoo 200ml', cat: 'baby', brand: 'Johnsons', pPrice: 280, sPrice: 330 },
  { name: 'Johnson Baby Lotion 200ml', cat: 'baby', brand: 'Johnsons', pPrice: 290, sPrice: 345 },
  { name: 'Johnson Baby Powder 200g', cat: 'baby', brand: 'Johnsons', pPrice: 180, sPrice: 215 },
  { name: 'Lactogen Baby Formula 1 400g', cat: 'baby', brand: 'Nestle', pPrice: 620, sPrice: 680 },
  { name: 'Cerelac Baby Cereal 400g', cat: 'baby', brand: 'Nestle', pPrice: 360, sPrice: 410 },
  { name: 'Baby Feeding Bottle 250ml', cat: 'baby', brand: 'Philips Avent', pPrice: 480, sPrice: 560 },
  { name: 'Bottle Cleaning Brush 1pc', cat: 'baby', brand: 'Pigeon', pPrice: 90, sPrice: 120 },
  { name: 'Baby Soother Pacifier 1pc', cat: 'baby', brand: 'Pigeon', pPrice: 140, sPrice: 175 },
  { name: 'Sudocrem Rash Cream 125g', cat: 'baby', brand: 'Sudocrem', pPrice: 490, sPrice: 580 },
  { name: 'Kids Toothbrush & Toothpaste Set', cat: 'baby', brand: 'Colgate', pPrice: 95, sPrice: 120 },
  { name: 'Baby Washcloths 4pcs', cat: 'baby', brand: 'Local', pPrice: 80, sPrice: 110 },
  { name: 'Baby Silicone Teether 1pc', cat: 'baby', brand: 'Pigeon', pPrice: 120, sPrice: 150 },
  { name: 'Educational Building Blocks Toy', cat: 'baby', brand: 'Lego Duplo', pPrice: 650, sPrice: 790 },

  // ⚡ 8. Home Electronics, Appliances & Hardware (166–185)
  { name: 'LED Light Bulb 12W 1pc', cat: 'electronics', brand: 'Super Star', pPrice: 180, sPrice: 220 },
  { name: 'Multi-Plug Extension Socket 5-Out', cat: 'electronics', brand: 'Click', pPrice: 340, sPrice: 420 },
  { name: 'Rechargeable Emergency Fan', cat: 'electronics', brand: 'Defender', pPrice: 2800, sPrice: 3400 },
  { name: 'Electric Kettle 1.8L', cat: 'electronics', brand: 'Miyako', pPrice: 750, sPrice: 900 },
  { name: 'Blender & Mixer Grinder Set', cat: 'electronics', brand: 'Miyako', pPrice: 2100, sPrice: 2600 },
  { name: 'Electric Rice Cooker 2.8L', cat: 'electronics', brand: 'Miyako', pPrice: 1850, sPrice: 2300 },
  { name: 'Hair Dryer 1500W 1pc', cat: 'electronics', brand: 'Nova', pPrice: 480, sPrice: 590 },
  { name: 'Electric Beard Trimmer 1pc', cat: 'electronics', brand: 'Kemei', pPrice: 650, sPrice: 790 },
  { name: 'Gas Stove Lighter Igniter 1pc', cat: 'electronics', brand: 'General', pPrice: 90, sPrice: 120 },
  { name: 'AA Rechargeable Batteries 4pcs', cat: 'electronics', brand: 'GP', pPrice: 140, sPrice: 180 },
  { name: 'AAA Batteries 4-Pack', cat: 'electronics', brand: 'GP Alkaline', pPrice: 85, sPrice: 110 },
  { name: 'Mosquito Swatter Rechargeable Bat', cat: 'electronics', brand: 'General', pPrice: 210, sPrice: 270 },
  { name: 'Smart Power Plug WiFi 1pc', cat: 'electronics', brand: 'Tuya', pPrice: 650, sPrice: 790 },
  { name: 'Emergency LED Torch Light 1pc', cat: 'electronics', brand: 'Defender', pPrice: 180, sPrice: 240 },
  { name: 'Electric Steam Iron 1pc', cat: 'electronics', brand: 'Philips', pPrice: 1950, sPrice: 2450 },
  { name: 'Insect Killer UV Lamp 1pc', cat: 'electronics', brand: 'Defender', pPrice: 850, sPrice: 1050 },
  { name: 'Voltage Stabilizer 1000VA', cat: 'electronics', brand: 'Super Star', pPrice: 2200, sPrice: 2700 },
  { name: 'Modern Wall Clock 1pc', cat: 'electronics', brand: 'RFL', pPrice: 320, sPrice: 420 },
  { name: 'Kitchen Digital Scale 5kg', cat: 'electronics', brand: 'General', pPrice: 280, sPrice: 380 },
  { name: 'Water Purifier Active Filter 1pc', cat: 'electronics', brand: 'Pureit', pPrice: 420, sPrice: 495 },

  // ✏️ 9. Stationery, Office & Accessories (186–200)
  { name: 'Matador Ballpoint Pens 12pcs', cat: 'stationery', brand: 'Matador', pPrice: 50, sPrice: 60 },
  { name: 'Econo Ballpoint Pens 12pcs', cat: 'stationery', brand: 'Econo', pPrice: 40, sPrice: 48 },
  { name: 'Gel Pens Black 12pcs', cat: 'stationery', brand: 'Sigma', pPrice: 90, sPrice: 120 },
  { name: 'Wooden Pencils 12pcs', cat: 'stationery', brand: 'Doms', pPrice: 60, sPrice: 75 },
  { name: 'A4 Printing Paper Ream 500S', cat: 'stationery', brand: 'Bashundhara', pPrice: 320, sPrice: 380 },
  { name: 'Spiral Notebook A5 120 Pages', cat: 'stationery', brand: 'Bashundhara', pPrice: 45, sPrice: 60 },
  { name: 'Highlighter Markers 5-Color Set', cat: 'stationery', brand: 'Deli', pPrice: 110, sPrice: 140 },
  { name: 'Sticky Notes Post-Its 1pc', cat: 'stationery', brand: '3M', pPrice: 35, sPrice: 50 },
  { name: 'Clear Stationery Tape 1pc', cat: 'stationery', brand: 'General', pPrice: 20, sPrice: 30 },
  { name: 'Duct Tape Industrial 1pc', cat: 'stationery', brand: 'General', pPrice: 75, sPrice: 95 },
  { name: 'Glue Sticks 20g 2pcs', cat: 'stationery', brand: 'Deli', pPrice: 40, sPrice: 55 },
  { name: 'Super Glue Tube 3g 1pc', cat: 'stationery', brand: 'Super Glue', pPrice: 15, sPrice: 20 },
  { name: 'Geometry Box Set 1pc', cat: 'stationery', brand: 'Deli', pPrice: 130, sPrice: 165 },
  { name: 'Office Scissors 1pc', cat: 'stationery', brand: 'Deli', pPrice: 60, sPrice: 75 },
  { name: 'Whiteboard Marker & Eraser Set', cat: 'stationery', brand: 'Deli', pPrice: 95, sPrice: 120 }
];

async function seedProducts() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Find Apex Supermarket Store
    const store = await Store.findOne({ name: 'Apex Supermarket' });
    if (!store) {
      console.error('❌ Store "Apex Supermarket" not found! Run the base seed script first.');
      process.exit(1);
    }
    console.log(`Found store: ${store.name} (ID: ${store._id})`);

    // 2. Find a default supplier for Apex Supermarket
    const supplier = await Supplier.findOne({ storeId: store._id });
    const defaultSupplierId = supplier ? supplier._id : new mongoose.Types.ObjectId();
    console.log(`Using Supplier ID: ${defaultSupplierId}`);

    // Delete existing products for Apex Supermarket first to prevent duplicate seeds
    console.log('Deleting existing products for Apex Supermarket...');
    const deleteResult = await Product.deleteMany({ storeId: store._id });
    console.log(`Deleted ${deleteResult.deletedCount} existing products.`);

    // 3. Format raw products list to match Mongoose schema
    const formattedProducts = rawProductsList.map((item, idx) => {
      // Generate standard SKU
      const cleanName = item.name
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toUpperCase();
      
      const categoryCode = item.cat.toUpperCase();
      const sku = `${categoryCode}-${cleanName.substring(0, 15)}-${idx + 100}`;

      // Generate randomized initial stock and threshold
      const currentStock = Math.floor(Math.random() * 80) + 10; // 10 to 90
      const minStockThreshold = Math.floor(Math.random() * 10) + 8; // 8 to 17

      return {
        name: item.name,
        sku: sku,
        description: `Premium quality ${item.name} under ${categoriesMap[item.cat]} category.`,
        category: categoriesMap[item.cat],
        brand: item.brand,
        storeId: store._id,
        supplierId: defaultSupplierId,
        purchasePrice: item.pPrice,
        sellingPrice: item.sPrice,
        currentStock: currentStock,
        minStockThreshold: minStockThreshold
      };
    });

    // 4. Insert into MongoDB
    console.log(`Inserting ${formattedProducts.length} products...`);
    const result = await Product.insertMany(formattedProducts);
    console.log(`Successfully seeded ${result.length} products for Apex Supermarket.`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedProducts();
