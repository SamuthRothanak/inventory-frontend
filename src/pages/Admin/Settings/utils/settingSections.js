import {
  FiDatabase,
  FiDollarSign,
  FiLock,
  FiPrinter,
  FiSliders,
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
    id: "password",
    title: "សុវត្ថិភាពគណនី",
    description: "ផ្លាស់ប្ដូរពាក្យសម្ងាត់សម្រាប់គណនីអ្នក។",
    icon: FiLock,
  },
  {
    id: "shop",
    title: "ព័ត៌មានហាង",
    description: "ឈ្មោះហាង លេខទូរស័ព្ទ អាសយដ្ឋាន និងអត្ថបទលើវិក្កយបត្រ។",
    icon: FiPrinter,
  },
  {
    id: "exchange",
    title: "អត្រាប្ដូររូបិយប័ណ្ណ",
    description: "អត្រា USD → KHR ដែលប្រើក្នុងប្រព័ន្ធ POS និងរបាយការណ៍។",
    icon: FiDollarSign,
  },
  {
    id: "rules",
    title: "គោលការណ៍ប្រព័ន្ធ",
    description: "លំហូរការលក់ ស្តុក ការទិញចូល និងការជូនដំណឹង។",
    icon: FiSliders,
  },
  {
    id: "system",
    title: "ឧបករណ៍ប្រព័ន្ធ",
    description: "ចូលទៅទិន្នន័យបម្រុង និងកំណត់ហេតុប្រព័ន្ធ។",
    icon: FiDatabase,
  },
];
