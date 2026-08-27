import { db } from './db';
import { schemes, users } from '@shared/schema';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...');

  const schemesData = [
    {
      name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      nameKannada: 'ಪಿಎಂ-ಕಿಸಾನ್',
      nameHindi: 'पीएम-किसान',
      description: 'Financial benefit of Rs. 6,000 per year to all landholding farmers irrespective of the size of their landholdings. The amount is released in three equal installments of Rs. 2,000 each directly into the bank accounts of the beneficiaries.',
      descriptionKannada: 'ಎಲ್ಲಾ ಭೂಮಿಯುಳ್ಳ ರೈತರಿಗೆ ವರ್ಷಕ್ಕೆ ರೂ. 6,000 ರ ಆರ್ಥಿಕ ಪ್ರಯೋಜನ. ಮೊತ್ತವನ್ನು ರೂ. 2,000 ರ ಮೂರು ಸಮಾನ ಕಂತುಗಳಲ್ಲಿ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗಳಿಗೆ ವರ್ಗಾಯಿಸಲಾಗುತ್ತದೆ.',
      descriptionHindi: 'सभी भूमिधारक किसानों को प्रति वर्ष 6,000 रुपये का वित्तीय लाभ। राशि को 2,000 रुपये की तीन समान किस्तों में सीधे बैंक खातों में जारी किया जाता है।',
      category: 'Agriculture',
      eligibility: {
        occupations: ['Farmer'],
        requiresLand: true,
      },
      benefits: [
        {
          titleEn: 'Direct Cash Transfer',
          titleKn: 'ನೇರ ನಗದು ವರ್ಗಾವಣೆ',
          titleHi: 'प्रत्यक्ष नकद हस्तांतरण',
          description: '₹6,000 per year in 3 installments',
        },
        {
          titleEn: 'No Farm Size Limit',
          titleKn: 'ಕೃಷಿ ಗಾತ್ರದ ಮಿತಿ ಇಲ್ಲ',
          titleHi: 'कोई फार्म आकार सीमा नहीं',
          description: 'All landholding farmers eligible',
        },
      ],
      requiredDocuments: ['Aadhar Card', 'Bank Account Details', 'Land Ownership Document'],
      applicationDeadline: '2025-12-31',
      howToApply: 'Visit the PM-KISAN portal or apply through Common Service Centers (CSCs). Submit land records, Aadhar, and bank details for verification.',
      howToApplyKannada: 'ಪಿಎಂ-ಕಿಸಾನ್ ಪೋರ್ಟಲ್‌ಗೆ ಭೇಟಿ ನೀಡಿ ಅಥವಾ ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರಗಳ (ಸಿಎಸ್‌ಸಿ) ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
      howToApplyHindi: 'पीएम-किसान पोर्टल पर जाएं या सामान्य सेवा केंद्रों (सीएससी) के माध्यम से आवेदन करें।',
      officialUrl: 'https://pmkisan.gov.in',
    },
    {
      name: 'Stand-Up India Scheme',
      nameKannada: 'ಸ್ಟಾಂಡ್-ಅಪ್ ಇಂಡಿಯಾ ಯೋಜನೆ',
      nameHindi: 'स्टैंड-अप इंडिया योजना',
      description: 'Facilitates bank loans between ₹10 lakh to ₹1 crore to at least one SC/ST borrower and one woman borrower per bank branch for setting up greenfield enterprises in manufacturing, services, or trading sector.',
      descriptionKannada: 'ಪ್ರತಿ ಬ್ಯಾಂಕ್ ಶಾಖೆಗೆ ಕನಿಷ್ಠ ಒಬ್ಬ ಎಸ್‌ಸಿ/ಎಸ್‌ಟಿ ಸಾಲಗಾರ ಮತ್ತು ಒಬ್ಬ ಮಹಿಳಾ ಸಾಲಗಾರರಿಗೆ ₹10 ಲಕ್ಷದಿಂದ ₹1 ಕೋಟಿಯವರೆಗೆ ಬ್ಯಾಂಕ್ ಸಾಲಗಳನ್ನು ಸುಗಮಗೊಳಿಸುತ್ತದೆ.',
      descriptionHindi: 'प्रति बैंक शाखा कम से कम एक एससी/एसटी उधारकर्ता और एक महिला उधारकर्ता को 10 लाख रुपये से 1 करोड़ रुपये के बीच बैंक ऋण की सुविधा प्रदान करता है।',
      category: 'Business',
      eligibility: {
        minIncome: 0,
        maxIncome: 1000000,
      },
      benefits: [
        {
          titleEn: 'Loan Amount',
          titleKn: 'ಸಾಲದ ಮೊತ್ತ',
          titleHi: 'ऋण राशि',
          description: '₹10 lakh to ₹1 crore',
        },
        {
          titleEn: 'Low Interest Rate',
          titleKn: 'ಕಡಿಮೆ ಬಡ್ಡಿ ದರ',
          titleHi: 'कम ब्याज दर',
          description: 'Competitive interest rates with government support',
        },
      ],
      requiredDocuments: ['Aadhar Card', 'PAN Card', 'Business Plan', 'Caste Certificate (if applicable)', 'Bank Account Statement'],
      applicationDeadline: '2025-12-31',
      howToApply: 'Apply through designated bank branches or the Stand-Up India portal. Submit business plan, identity proof, and address proof.',
      howToApplyKannada: 'ನಿಗದಿತ ಬ್ಯಾಂಕ್ ಶಾಖೆಗಳು ಅಥವಾ ಸ್ಟಾಂಡ್-ಅಪ್ ಇಂಡಿಯಾ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.',
      howToApplyHindi: 'नामित बैंक शाखाओं या स्टैंड-अप इंडिया पोर्टल के माध्यम से आवेदन करें।',
      officialUrl: 'https://www.standupmitra.in',
    },
    {
      name: 'Pradhan Mantri Mudra Yojana (PMMY)',
      nameKannada: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಮುದ್ರಾ ಯೋಜನೆ',
      nameHindi: 'प्रधानमंत्री मुद्रा योजना',
      description: 'Provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises for income-generating activities in manufacturing, trading, and services sectors.',
      descriptionKannada: 'ಉತ್ಪಾದನೆ, ವ್ಯಾಪಾರ ಮತ್ತು ಸೇವಾ ವಲಯಗಳಲ್ಲಿ ಆದಾಯ ಸೃಷ್ಟಿಸುವ ಚಟುವಟಿಕೆಗಳಿಗೆ ಸಣ್ಣ/ಸೂಕ್ಷ್ಮ ಉದ್ಯಮಗಳಿಗೆ ₹10 ಲಕ್ಷದವರೆಗೆ ಸಾಲ ಒದಗಿಸುತ್ತದೆ.',
      descriptionHindi: 'विनिर्माण, व्यापार और सेवा क्षेत्रों में आय-सृजन गतिविधियों के लिए गैर-कॉर्पोरेट, गैर-कृषि छोटे/सूक्ष्म उद्यमों को 10 लाख रुपये तक का ऋण प्रदान करता है।',
      category: 'Business',
      eligibility: {
        occupations: ['Small Business Owner', 'Trader', 'Artisan'],
      },
      benefits: [
        {
          titleEn: 'Flexible Loan Categories',
          titleKn: 'ಹೊಂದಿಕೊಳ್ಳುವ ಸಾಲ ವರ್ಗಗಳು',
          titleHi: 'लचीली ऋण श्रेणियां',
          description: 'Shishu (up to ₹50,000), Kishor (₹50,000-₹5 lakh), Tarun (₹5-10 lakh)',
        },
        {
          titleEn: 'No Collateral',
          titleKn: 'ಯಾವುದೇ ಮೇಲಾಧಾರ ಇಲ್ಲ',
          titleHi: 'कोई संपार्श्विक नहीं',
          description: 'Collateral-free loans for small businesses',
        },
      ],
      requiredDocuments: ['Aadhar Card', 'PAN Card', 'Business Plan/Proof', 'Bank Account Statement'],
      applicationDeadline: null,
      howToApply: 'Visit any bank, NBFC, or MFI offering MUDRA loans. Fill out the application form and submit required documents.',
      howToApplyKannada: 'ಮುದ್ರಾ ಸಾಲ ನೀಡುವ ಯಾವುದೇ ಬ್ಯಾಂಕ್, ಎನ್‌ಬಿಎಫ್‌ಸಿ ಅಥವಾ ಎಂಎಫ್‌ಐಗೆ ಭೇಟಿ ನೀಡಿ.',
      howToApplyHindi: 'मुद्रा ऋण प्रदान करने वाले किसी भी बैंक, एनबीएफसी, या एमएफआई पर जाएं।',
      officialUrl: 'https://www.mudra.org.in',
    },
    {
      name: 'Mahila Samman Savings Certificate',
      nameKannada: 'ಮಹಿಳಾ ಸಮ್ಮಾನ್ ಉಳಿತಾಯ ಪ್ರಮಾಣಪತ್ರ',
      nameHindi: 'महिला सम्मान बचत प्रमाणपत्र',
      description: 'One-time savings scheme for women with a maturity period of 2 years. Offers attractive interest rates with partial withdrawal facility after 1 year.',
      descriptionKannada: '2 ವರ್ಷಗಳ ಪರಿಪಕ್ವತೆಯ ಅವಧಿಯೊಂದಿಗೆ ಮಹಿಳೆಯರಿಗೆ ಒಂದು-ಬಾರಿ ಉಳಿತಾಯ ಯೋಜನೆ. 1 ವರ್ಷದ ನಂತರ ಭಾಗಶಃ ಹಿಂಪಡೆಯುವ ಸೌಲಭ್ಯದೊಂದಿಗೆ ಆಕರ್ಷಕ ಬಡ್ಡಿ ದರಗಳನ್ನು ನೀಡುತ್ತದೆ.',
      descriptionHindi: '2 साल की परिपक्वता अवधि के साथ महिलाओं के लिए एक बार की बचत योजना। 1 साल बाद आंशिक निकासी सुविधा के साथ आकर्षक ब्याज दरें प्रदान करती है।',
      category: 'Women Empowerment',
      eligibility: {
        gender: 'Female',
        minAge: 18,
      },
      benefits: [
        {
          titleEn: 'High Interest Rate',
          titleKn: 'ಹೆಚ್ಚಿನ ಬಡ್ಡಿ ದರ',
          titleHi: 'उच्च ब्याज दर',
          description: '7.5% per annum (compounded quarterly)',
        },
        {
          titleEn: 'Partial Withdrawal',
          titleKn: 'ಭಾಗಶಃ ಹಿಂಪಡೆಯುವಿಕೆ',
          titleHi: 'आंशिक निकासी',
          description: 'Withdraw up to 40% after 1 year',
        },
      ],
      requiredDocuments: ['Aadhar Card', 'PAN Card', 'Passport-size Photograph', 'Address Proof'],
      applicationDeadline: '2025-03-31',
      howToApply: 'Visit any post office or designated bank. Fill the application form and deposit the desired amount (₹1,000 to ₹2 lakh).',
      howToApplyKannada: 'ಯಾವುದೇ ಅಂಚೆ ಕಚೇರಿ ಅಥವಾ ನಿಗದಿತ ಬ್ಯಾಂಕ್‌ಗೆ ಭೇಟಿ ನೀಡಿ.',
      howToApplyHindi: 'किसी भी डाकघर या नामित बैंक पर जाएं।',
      officialUrl: 'https://www.indiapost.gov.in',
    },
    {
      name: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
      nameKannada: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ - ಗ್ರಾಮೀಣ',
      nameHindi: 'प्रधानमंत्री आवास योजना - ग्रामीण',
      description: 'Provides financial assistance for construction of pucca houses with basic amenities to eligible rural households. Target is to achieve "Housing for All" by 2024.',
      descriptionKannada: 'ಅರ್ಹ ಗ್ರಾಮೀಣ ಕುಟುಂಬಗಳಿಗೆ ಮೂಲ ಸೌಕರ್ಯಗಳೊಂದಿಗೆ ಪಕ್ಕಾ ಮನೆಗಳ ನಿರ್ಮಾಣಕ್ಕಾಗಿ ಆರ್ಥಿಕ ಸಹಾಯ ಒದಗಿಸುತ್ತದೆ.',
      descriptionHindi: 'पात्र ग्रामीण परिवारों को बुनियादी सुविधाओं के साथ पक्के घर के निर्माण के लिए वित्तीय सहायता प्रदान करता है।',
      category: 'Housing',
      eligibility: {
        maxIncome: 180000,
      },
      benefits: [
        {
          titleEn: 'Financial Assistance',
          titleKn: 'ಆರ್ಥಿಕ ಸಹಾಯ',
          titleHi: 'वित्तीय सहायता',
          description: '₹1.2 lakh in plains, ₹1.3 lakh in hilly states',
        },
        {
          titleEn: 'Basic Amenities',
          titleKn: 'ಮೂಲ ಸೌಕರ್ಯಗಳು',
          titleHi: 'बुनियादी सुविधाएं',
          description: 'Support for toilet, electricity, and clean cooking fuel',
        },
      ],
      requiredDocuments: ['Aadhar Card', 'Income Certificate', 'Caste Certificate (if applicable)', 'Bank Account Details', 'Socio-Economic Caste Census (SECC) data'],
      applicationDeadline: null,
      howToApply: 'Applications are invited by Gram Panchayat. Eligible beneficiaries are identified through SECC data and approved by Gram Sabha.',
      howToApplyKannada: 'ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಿಂದ ಅರ್ಜಿಗಳನ್ನು ಆಹ್ವಾನಿಸಲಾಗುತ್ತದೆ.',
      howToApplyHindi: 'ग्राम पंचायत द्वारा आवेदन आमंत्रित किए जाते हैं।',
      officialUrl: 'https://pmayg.nic.in',
    },
    {
      name: 'Skill India Digital (SID)',
      nameKannada: 'ಸ್ಕಿಲ್ ಇಂಡಿಯಾ ಡಿಜಿಟಲ್',
      nameHindi: 'स्किल इंडिया डिजिटल',
      description: 'Comprehensive digital platform offering free skill training courses in various sectors. Provides certificates and connects learners with employment opportunities.',
      descriptionKannada: 'ವಿವಿಧ ವಲಯಗಳಲ್ಲಿ ಉಚಿತ ಕೌಶಲ್ಯ ತರಬೇತಿ ಕೋರ್ಸ್‌ಗಳನ್ನು ನೀಡುವ ಸಮಗ್ರ ಡಿಜಿಟಲ್ ವೇದಿಕೆ. ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಒದಗಿಸುತ್ತದೆ ಮತ್ತು ಉದ್ಯೋಗ ಅವಕಾಶಗಳೊಂದಿಗೆ ಕಲಿಯುವವರನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.',
      descriptionHindi: 'विभिन्न क्षेत्रों में मुफ्त कौशल प्रशिक्षण पाठ्यक्रम प्रदान करने वाला व्यापक डिजिटल मंच। प्रमाणपत्र प्रदान करता है और शिक्षार्थियों को रोजगार के अवसरों से जोड़ता है।',
      category: 'Education & Training',
      eligibility: {
        minAge: 15,
      },
      benefits: [
        {
          titleEn: 'Free Training',
          titleKn: 'ಉಚಿತ ತರಬೇತಿ',
          titleHi: 'मुफ्त प्रशिक्षण',
          description: 'Access to 1000+ free online courses',
        },
        {
          titleEn: 'Industry Certification',
          titleKn: 'ಉದ್ಯಮ ಪ್ರಮಾಣೀಕರಣ',
          titleHi: 'उद्योग प्रमाणन',
          description: 'Recognized certificates upon completion',
        },
        {
          titleEn: 'Job Connections',
          titleKn: 'ಉದ್ಯೋಗ ಸಂಪರ್ಕಗಳು',
          titleHi: 'नौकरी कनेक्शन',
          description: 'Direct linkage to employment opportunities',
        },
      ],
      requiredDocuments: ['Aadhar Card', 'Email ID', 'Mobile Number'],
      applicationDeadline: null,
      howToApply: 'Register on the Skill India Digital platform using Aadhar-based authentication. Choose courses, complete training, and receive certificates.',
      howToApplyKannada: 'ಆಧಾರ್ ಆಧಾರಿತ ದೃಢೀಕರಣವನ್ನು ಬಳಸಿಕೊಂಡು ಸ್ಕಿಲ್ ಇಂಡಿಯಾ ಡಿಜಿಟಲ್ ವೇದಿಕೆಯಲ್ಲಿ ನೋಂದಾಯಿಸಿ.',
      howToApplyHindi: 'आधार-आधारित प्रमाणीकरण का उपयोग करके स्किल इंडिया डिजिटल प्लेटफॉर्म पर पंजीकरण करें।',
      officialUrl: 'https://www.skillindia.gov.in',
    },
  ];

  console.log('Adding government schemes...');
  for (const scheme of schemesData) {
    await db.insert(schemes).values(scheme);
  }
  console.log(`✅ Added ${schemesData.length} schemes`);

  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    name: 'Admin User',
    phone: '9876543210',
    email: 'admin@schemes.gov.in',
    password: hashedPassword,
    isAdmin: true,
    state: 'Karnataka',
    district: 'Bangalore',
    occupation: 'Government Officer',
    monthlyIncome: 50000,
    hasLand: false,
    gender: 'Male',
    dateOfBirth: '1990-01-01',
  });
  console.log('✅ Admin user created (phone: 9876543210, password: admin123)');

  console.log('Creating test user...');
  const testPassword = await bcrypt.hash('test123', 10);
  await db.insert(users).values({
    name: 'Ramesh Kumar',
    phone: '9876543211',
    email: 'ramesh@test.com',
    password: testPassword,
    isAdmin: false,
    state: 'Karnataka',
    district: 'Mysore',
    occupation: 'Farmer',
    monthlyIncome: 15000,
    hasLand: true,
    landArea: 5,
    gender: 'Male',
    dateOfBirth: '1985-06-15',
  });
  console.log('✅ Test user created (phone: 9876543211, password: test123)');

  console.log('🎉 Database seeded successfully!');
}

seed().catch(console.error);
