import {
  FiBell,
  FiDatabase,
  FiDollarSign,
  FiLock,
  FiMonitor,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from "react-icons/fi";

export const settingSections = [
  {
    id: "profile",
    title: "ព័ត៌មានគណនី",
    description: "កែប្រែឈ្មោះ អ៊ីម៉ែល និងលេខទូរស័ព្ទរបស់គណនីអ្នក។",
    icon: FiUser,
  },
  {
    id: "shop",
    title: "ព័ត៌មានហាង",
    description: "ព័ត៌មានដែលប្រើលើវិក្កយបត្រ បង្កាន់ដៃ និងរបាយការណ៍។",
    icon: FiMonitor,
  },
  {
    id: "password",
    title: "ផ្លាស់ប្ដូរពាក្យសម្ងាត់",
    description: "កំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់គណនីអ្នក។",
    icon: FiLock,
  },
  {
    id: "exchange",
    title: "អត្រាប្ដូររូបិយប័ណ្ណ",
    description: "អត្រា USD → KHR ដែលប្រើក្នុងប្រព័ន្ធ POS និងរបាយការណ៍។",
    icon: FiDollarSign,
  },
  {
    id: "sales",
    title: "ការលក់ និង POS",
    description: "គោលការណ៍លក់ បង់ប្រាក់ បោះពុម្ព និងការបង្វិលទំនិញ។",
    icon: FiShoppingCart,
  },
  {
    id: "inventory",
    title: "ស្តុក និងការជូនដំណឹង",
    description: "ការគ្រប់គ្រងស្តុក ការជូនដំណឹងទំនិញជិតអស់ និងផុតកំណត់។",
    icon: FiBell,
  },
  {
    id: "purchase",
    title: "ការទិញចូល",
    description: "លំហូរ stock-in ការខូចខាត និង supplier claim។",
    icon: FiTruck,
  },
  {
    id: "system",
    title: "ឧបករណ៍ប្រព័ន្ធ",
    description: "ចូលទៅ Backup Data, Audit Log និង module សុវត្ថិភាពទិន្នន័យ។",
    icon: FiDatabase,
  },
];
