// SDO Cabuyao SHS Portal - Mock Data
// SDO Cabuyao Primary Color: #3b4cb8 (Blue)

// Carousel / Hero Slider Images
const sliderImages = [
  {
    id: 1,
    src: '/MEMO.png',
    title: 'MEMORANDUM',
    caption: 'DepEd Memorandum 2026',
    link: 'https://www.deped.gov.ph/wp-content/uploads/DM_s2026_012r.pdf',
    category: 'Issuance'
  },
  {
    id: 2,
    src: '/MEMO.png',
    title: 'MEMORANDUM',
    caption: 'DepEd Memorandum 2026',
    link: 'https://www.deped.gov.ph/wp-content/uploads/DM_s2026_012r.pdf',
    category: 'Issuance'
  },
  {
    id: 3,
    src: '/MEMO.png',
    title: 'MEMORANDUM',
    caption: 'DepEd Memorandum 2026',
    link: 'https://www.deped.gov.ph/wp-content/uploads/DM_s2026_012r.pdf',
    category: 'Issuance'
  },
  {
    id: 4,
    src: '/MEMO.png',
    title: 'MEMORANDUM',
    caption: 'DepEd Memorandum 2026',
    link: 'https://www.deped.gov.ph/wp-content/uploads/DM_s2026_012r.pdf',
    category: 'Issuance'
  }
];

// Quick Info / Jobs Section
const quickInfo = [
  { 
    id: 1, 
    title: '📢 Immediate Hiring', 
    detail: 'Teaching and non-teaching positions available. Apply within the deadline.', 
    link: '#',
    icon: '💼',
    stats: '12 Positions'
  },
  { 
    id: 2, 
    title: '📊 Assessment Results', 
    detail: 'Quarterly assessment results have been published. Check your portal.', 
    link: '#',
    icon: '📈',
    stats: 'Available'
  },
  { 
    id: 3, 
    title: '🎯 Job Opportunities', 
    detail: 'Industry partners offering internship and job placements for graduates.', 
    link: '#',
    icon: '🎯',
    stats: '8 Companies'
  },
  { 
    id: 4, 
    title: '🏆 Competitions', 
    caption: 'Regional and division-level competitions now open for registration.', 
    detail: 'Join our talented students in various academic and sports events.', 
    link: '#',
    icon: '🏆',
    stats: '5 Events'
  }
];

// News Feed (Mock SDO Facebook Feed)
const news = [
  { 
    id: 1, 
    date: '2026-03-13', 
    title: 'SDO Cabuyao Celebrates National Science Week', 
    excerpt: 'Students showcase innovative projects during the annual science fair...',
    author: 'SDO Cabuyao',
    category: 'Academic'
  },
  { 
    id: 2, 
    date: '2026-03-12', 
    title: 'Senior High Graduation Schedule Released', 
    excerpt: 'The official graduation ceremony for SY 2025-2026 is scheduled for...',
    author: 'Registrar\'s Office',
    category: 'Academic'
  },
  { 
    id: 3, 
    date: '2026-03-10', 
    title: 'Sports Meet Winners Announced', 
    excerpt: 'Congratulations to all athletes who participated in the division sports meet...',
    author: 'PE Department',
    category: 'Sports'
  },
  { 
    id: 4, 
    date: '2026-03-08', 
    title: 'Scholarship Applications Now Open', 
    excerpt: 'Various scholarship programs available for deserving students. Apply now!',
    author: 'Guidance Office',
    category: 'Scholarship'
  },
  { 
    id: 5, 
    date: '2026-03-05', 
    title: 'Faculty Development Training', 
    excerpt: 'Teachers attend intensive training on new teaching methodologies...',
    author: 'HR Office',
    category: 'Faculty'
  }
];

// Calendar Events
const calendarEvents = [
  { date: '2026-03-15', title: 'Parent-Teacher Conference', type: 'event' },
  { date: '2026-03-18', title: 'Mid-Term Exams Begin', type: 'academic' },
  { date: '2026-03-22', title: 'Faculty Development Day', type: 'event' },
  { date: '2026-03-25', title: 'Science Fair', type: 'academic' },
  { date: '2026-03-28', title: 'Sports Day', type: 'sports' },
  { date: '2026-03-30', title: 'Deadline: Enrollment', type: 'admin' }
];

// Files by Folder/Year (for File Explorer)
const filesByFolder = [
  { 
    id: '2026', 
    label: '2026 Issuances', 
    icon: '📁',
    files: [
      { id: 1, name: 'QA_Summary_2026.pdf', type: 'pdf', size: '3.2MB', date: '2026-01-15' },
      { id: 2, name: 'NAT_Admin_Guide.pdf', type: 'pdf', size: '2.4MB', date: '2026-01-20' },
      { id: 3, name: 'Regional_Festival_Guide.pdf', type: 'pdf', size: '900KB', date: '2026-02-01' },
      { id: 4, name: 'Enrollment_Guidelines.pdf', type: 'pdf', size: '1.1MB', date: '2026-02-10' }
    ]
  },
  { 
    id: '2025', 
    label: '2025 Issuances', 
    icon: '📁',
    files: [
      { id: 5, name: 'Annual_Report_2025.pdf', type: 'pdf', size: '5.2MB', date: '2025-12-15' },
      { id: 6, name: 'SHS_Resource_Package.pdf', type: 'pdf', size: '4.5MB', date: '2025-11-01' },
      { id: 7, name: 'Curriculum_Guidelines.pdf', type: 'pdf', size: '2.1MB', date: '2025-10-20' }
    ]
  },
  { 
    id: '2024', 
    label: '2024 Issuances', 
    icon: '📁',
    files: [
      { id: 8, name: 'Regional_Report_2024.pdf', type: 'pdf', size: '2.0MB', date: '2024-12-10' },
      { id: 9, name: 'Policy_Update_2024.pdf', type: 'pdf', size: '1.1MB', date: '2024-11-05' }
    ]
  },
  { 
    id: '2023', 
    label: '2023 Issuances', 
    icon: '📁',
    files: [
      { id: 10, name: 'Division_Memo_001.pdf', type: 'pdf', size: '1.2MB', date: '2023-08-15' },
      { id: 11, name: 'Guidelines_Annex.pdf', type: 'pdf', size: '800KB', date: '2023-09-20' }
    ]
  }
];

// Core Sections for Cards
const coreSections = [
  { 
    key: 'about', 
    title: 'About', 
    desc: 'Overview of SHS portal and mission-vision',
    icon: '🏛️',
    color: '#3b4cb8',
    link: '/about'
  },
  { 
    key: 'org', 
    title: 'Organizational Structure', 
    desc: 'Leadership & offices, departments',
    icon: '🏢',
    color: '#5c6bc0',
    link: '/org'
  },
  { 
    key: 'policy', 
    title: 'Policy', 
    desc: 'Rules, guidelines, and regulations',
    icon: '📋',
    color: '#7986cb',
    link: '/policy'
  },
  { 
    key: 'issuances', 
    title: 'Issuances', 
    desc: 'Orders, memos, and circulars',
    icon: '📜',
    color: '#3b4cb8',
    link: '/issuances'
  },
  { 
    key: 'services', 
    title: 'Services', 
    desc: 'Student & staff services',
    icon: '🛠️',
    color: '#5c6bc0',
    link: '/services'
  },
  { 
    key: 'inventory', 
    title: 'Inventory', 
    desc: 'Assets, equipment, and resources',
    icon: '📦',
    color: '#7986cb',
    link: '/inventory'
  },
  { 
    key: 'research', 
    title: 'Research & Innovation', 
    desc: 'Projects, studies, and publications',
    icon: '🔬',
    color: '#3b4cb8',
    link: '/research'
  }
];

// SDO Cabuyao Brand Colors
const brandColors = {
  primary: '#3b4cb8',
  primaryLight: '#5c6bc0',
  primaryDark: '#2a3578',
  secondary: '#7986cb',
  accent: '#ff6f00',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  gray100: '#f8f9fa',
  gray200: '#e9ecef',
  gray300: '#dee2e6',
  gray400: '#ced4da',
  gray500: '#adb5bd',
  gray600: '#6c757d',
  gray700: '#495057',
  gray800: '#343a40',
  gray900: '#212529'
};

// Export all data
export { 
  sliderImages, 
  quickInfo, 
  news, 
  calendarEvents, 
  filesByFolder, 
  coreSections,
  brandColors 
};
