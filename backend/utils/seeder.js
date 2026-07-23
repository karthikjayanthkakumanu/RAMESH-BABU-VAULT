const User = require('../models/User');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

const seedData = async () => {
  try {
    // 1. Seed Predefined Users
    const usersToSeed = [
      {
        name: 'Kakumanu Ramesh Babu',
        username: '9705411415',
        password: 'Ramesh@2343',
        role: 'Admin',
      },
      {
        name: 'Kakumanu Karthik Jayanth',
        username: '7386002627',
        password: 'Kakumanu@23092005',
        role: 'Admin',
      },
      {
        name: 'Kakumanu Lalitha Karuna',
        username: '9951903389',
        password: 'Lalitha@2343',
        role: 'Admin',
      },
    ];

    for (const u of usersToSeed) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        await User.create(u);
        console.log(`Seeded User: ${u.username} (${u.name})`);
      }
    }

    // 2. Define Predefined Categories and Subcategories
    const predefinedStructure = [
      {
        name: 'KAKUMANU RAMESH BABU (Boss)',
        subcategories: [
          'Education',
          'Banks',
          'Important Documents',
          'Petrol Bunk Papers',
          'I. Sathyanarayana Documents',
          'Loan Documents',
          'Important Screenshots',
          'Other Documents',
        ],
      },
      {
        name: 'KAKUMANU LALITHA KARUNA (Home Minister)',
        subcategories: [
          'Education',
          'Banks',
          'Important Documents',
          'Loan Documents',
          'Other Documents',
        ],
      },
      {
        name: 'KAKUMANU DEVI KALA NIHARIKA (Queen of The House)',
        subcategories: [
          'Education',
          'Important Documents',
          'School Documents',
          'Other Documents',
        ],
      },
      {
        name: 'KAKUMANU KARTHIK JAYANTH (Chief Secretary)',
        subcategories: [
          'Education',
          'Important Documents',
          'Banks',
          'Loan Documents',
          'Parul Documents',
          'Other Documents',
        ],
      },
      {
        name: 'HOUSE DOCUMENTS',
        subcategories: [],
      },
      {
        name: 'BANK RELATED DOCUMENTS',
        subcategories: [],
      },
      {
        name: 'FAMILY MEMBER DOCUMENTS',
        subcategories: [],
      },
      {
        name: 'OTHERS',
        subcategories: [],
      },
    ];

    // Seed Categories & Subcategories
    for (const catInfo of predefinedStructure) {
      let category = await Category.findOne({ name: catInfo.name });
      if (!category) {
        category = await Category.create({
          name: catInfo.name,
          isPredefined: true,
          description: `Documents related to ${catInfo.name}`,
        });
        console.log(`Seeded category: ${catInfo.name}`);
      }

      for (const subName of catInfo.subcategories) {
        const subExists = await SubCategory.findOne({
          name: subName,
          category: category._id,
        });
        if (!subExists) {
          await SubCategory.create({
            name: subName,
            category: category._id,
            isPredefined: true,
          });
          console.log(`Seeded subcategory "${subName}" under "${catInfo.name}"`);
        }
      }
    }

    console.log('Database seeding checked successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedData;
