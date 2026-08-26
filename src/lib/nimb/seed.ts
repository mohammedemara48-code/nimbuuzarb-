import type { Person, Post, Room, Status } from "./types";

export const ME: Person = {
  id: "me",
  name: "رنا",
  age: 26,
  city: "جدة",
  bio: "بدور على حد صادق، قهوة بعد ١٢ مسموحة.",
  photo: "",
  online: true,
  looking: "نساء",
};

export const PEOPLE: Person[] = [
  {
    id: "layan",
    name: "ليان",
    age: 26,
    city: "جدة",
    bio: "هادية في الظاهر، صريحة في الخاص. قهوة أحسن من الدردشة الفاضية.",
    photo: "/people/layan.jpg",
    online: true,
    looking: "نساء",
  },
  {
    id: "omar",
    name: "عمر",
    age: 28,
    city: "القاهرة",
    bio: "بدور على حد يفهم وسط البلد الساعة ٣ الفجر من غير تمثيل.",
    photo: "/people/omar.jpg",
    online: true,
    looking: "رجال",
  },
  {
    id: "yasmine",
    name: "ياسمين",
    age: 24,
    city: "دبي",
    bio: "رووف مش منظر. لو مش جاهز لصراحة، اكتفي بالمرور.",
    photo: "/people/yasmine.jpg",
    online: false,
    looking: "نساء",
  },
  {
    id: "ziyad",
    name: "زياد",
    age: 29,
    city: "عمّان",
    bio: "كتب، قطط، وسكر زيادة. التعارف يبدأ بجملة غلط.",
    photo: "/people/ziyad.jpg",
    online: true,
    looking: "رجال",
  },
  {
    id: "nora",
    name: "نورة",
    age: 25,
    city: "الإسكندرية",
    bio: "بحر، أمان، وما فيش دراما زيادة عن اللزوم.",
    photo: "/people/nora.jpg",
    online: true,
    looking: "نساء",
  },
  {
    id: "tamer",
    name: "تامر",
    age: 27,
    city: "الرياض",
    bio: "أضيف ببطء وألغي أسرع. الخصوصية مش خيار.",
    photo: "/people/tamer.jpg",
    online: false,
    looking: "رجال",
  },
  {
    id: "rania",
    name: "رانيا",
    age: 23,
    city: "القاهرة",
    bio: "أكتب تجاربي، وأنشر صوري، وأضحك بعدين أفكر.",
    photo: "/people/rania.jpg",
    online: true,
    looking: "نساء",
  },
  {
    id: "bassel",
    name: "باسل",
    age: 31,
    city: "بيروت",
    bio: "هدوء، كلام قليل، ورسائل قصيرة أحسن من فقرات.",
    photo: "/people/bassel.jpg",
    online: false,
    looking: "رجال",
  },
];

export const ROOMS: Room[] = [
  { id: "community", name: "مجتمع الخليج", topic: "مساحة خاصة للتعارف بأمان", members: 1284 },
  { id: "jeddah", name: "تعارف جدة", topic: "ناس قريبة، كلام أوضح", members: 642 },
  { id: "late", name: "سهر وأمان", topic: "بعد ١٢، الصراحة مسموحة", members: 311 },
  { id: "stories", name: "تجاربنا", topic: "قصص وتعارف من غير أحكام", members: 890 },
];

export const FRIEND_IDS = ["omar", "ziyad", "rania", "tamer"];

export const STATUSES: Status[] = [
  { id: "st-layan", authorId: "layan", image: "/stories/layan.jpg", seen: false },
  { id: "st-omar", authorId: "omar", image: "/stories/omar.jpg", seen: false },
  { id: "st-nora", authorId: "nora", image: "/stories/nora.jpg", seen: false },
  { id: "st-tamer", authorId: "tamer", image: "/stories/tamer.jpg", seen: false },
];

const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const POSTS: Post[] = [
  {
    id: "p1",
    authorId: "omar",
    kind: "photo",
    body: "القط حكم على حياتي العاطفية. الحكم نهائي.",
    image: "/feed/cat.jpg",
    likes: ["rania", "layan"],
    comments: [
      { id: "c1", authorId: "rania", body: "القط عنده حق.", createdAt: ago(1) },
    ],
    createdAt: ago(2),
  },
  {
    id: "p2",
    authorId: "layan",
    kind: "story",
    body: "تجربة: أول رسالة كانت صريحة. ارتحت أكتر من ألف سلام فاضي.",
    likes: ["omar", "ziyad", "me"],
    comments: [
      { id: "c2", authorId: "ziyad", body: "الصراحة بتوفّر وقت.", createdAt: ago(3) },
    ],
    createdAt: ago(5),
  },
  {
    id: "p3",
    authorId: "nora",
    kind: "photo",
    body: "الكورنيش الساعة دي بيصالح أي مود سيء.",
    image: "/feed/corniche.jpg",
    likes: ["layan"],
    comments: [],
    createdAt: ago(8),
  },
  {
    id: "p4",
    authorId: "rania",
    kind: "story",
    body: "كتبت تجربة أول تعارف فاشل. الدرس: لو مش مرتاح، قول من الأول.",
    likes: ["tamer", "omar"],
    comments: [
      { id: "c3", authorId: "tamer", body: "الوضوح بيحمي الطرفين.", createdAt: ago(9) },
    ],
    createdAt: ago(12),
  },
  {
    id: "p5",
    authorId: "yasmine",
    kind: "photo",
    body: "الرووف فاضي. الكرسي مستني حد يسمع من غير أحكام.",
    image: "/feed/rooftop.jpg",
    likes: [],
    comments: [],
    createdAt: ago(14),
  },
  {
    id: "p6",
    authorId: "ziyad",
    kind: "photo",
    body: "مكتب ليلي: كنافة، ملاحظات، وصبر قليل على الرسائل.",
    image: "/feed/desk.jpg",
    likes: ["rania"],
    comments: [],
    createdAt: ago(18),
  },
];

export const SEED_DMS: Record<string, { from: "me" | "them"; body: string; hours: number }[]> = {
  omar: [
    { from: "them", body: "الرسالة اللي بعتها إمبارح وصلت في وقتها.", hours: 20 },
    { from: "me", body: "كنت محتاج أسمع حد فاهم من غير شرح زيادة.", hours: 18 },
    { from: "them", body: "ابعت لما تزهق من الناس اللي بتمثّل.", hours: 6 },
  ],
  rania: [
    { from: "them", body: "قريتي تجربتي؟ ولا لأ.", hours: 10 },
    { from: "me", body: "قريتها. الدرس صحيح.", hours: 8 },
  ],
  yasmine: [
    { from: "them", body: "لو مش جاهز لصراحة، قول من دلوقتي.", hours: 4 },
  ],
  bassel: [
    { from: "them", body: "رسالة قصيرة: هلا.", hours: 30 },
  ],
};

export const SEED_ROOM_CHAT: Record<string, { sender: string; body: string; hours: number }[]> = {
  community: [
    { sender: "omar", body: "القاعدة هنا: احترام، وبعدين تعارف.", hours: 5 },
    { sender: "layan", body: "ومن يضغط يُطرد بلطف.", hours: 4 },
    { sender: "rania", body: "وصلت متأخرة. المكان مرتاح.", hours: 2 },
  ],
  jeddah: [
    { sender: "layan", body: "حد في الحمزة دلوقتي ولا كله أونلاين بس؟", hours: 3 },
    { sender: "tamer", body: "أنا رياض، بس أحب جدة أكثر من اللزوم.", hours: 2 },
  ],
  late: [
    { sender: "nora", body: "السهر بيظهر الناس على حقيقتها.", hours: 1 },
    { sender: "ziyad", body: "أو يفضح إنك جعان بس.", hours: 1 },
  ],
  stories: [
    { sender: "bassel", body: "أول تعارف ناجح بدأ بجملة عادية جدًا.", hours: 6 },
    { sender: "omar", body: "العادي أحيانًا أصدق من المسرح.", hours: 5 },
  ],
};
