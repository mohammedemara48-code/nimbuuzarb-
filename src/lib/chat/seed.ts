export const SEED_CONTACTS = [
  {
    key: "youssef",
    name: "يوسف حسن",
    handle: "youssef",
    avatar: "/avatars/youssef.jpg",
    presence: "online" as const,
    unread: 2,
    thread: [
      { sender: "them" as const, body: "يا صاحبي، وصلت المكتب ولا لسه؟" },
      { sender: "me" as const, body: "لسه في الطريق، الزحمة نار النهاردة." },
      { sender: "them" as const, body: "ماشي، كلّمني أول ما تخلص." },
      { sender: "them" as const, body: "ونظّم مكالمة فيديو لو حابب نراجع الملف بسرعة." },
    ],
  },
  {
    key: "nada",
    name: "ندى عادل",
    handle: "nada",
    avatar: "/avatars/nada.jpg",
    presence: "online" as const,
    unread: 0,
    thread: [
      { sender: "me" as const, body: "صباح الخير ندى، الملف اتبعت." },
      { sender: "them" as const, body: "صباح الفل، تمام هراجعه بعد الظهر." },
      { sender: "them" as const, body: "لو احتجتيني في مكالمة قولي." },
    ],
  },
  {
    key: "karim",
    name: "كريم فؤاد",
    handle: "karim",
    avatar: "/avatars/karim.jpg",
    presence: "away" as const,
    unread: 1,
    thread: [
      { sender: "them" as const, body: "هتكون فين بكرة؟" },
      { sender: "me" as const, body: "هعدّي على وسط البلد بعد الشغل." },
      { sender: "them" as const, body: "تمام، أبعتلك المكان." },
    ],
  },
  {
    key: "salma",
    name: "سلمى منصور",
    handle: "salma",
    avatar: "/avatars/salma.jpg",
    presence: "offline" as const,
    unread: 0,
    thread: [
      { sender: "them" as const, body: "شكراً إنك ردّيت بسرعة إمبارح." },
      { sender: "me" as const, body: "العفو، أي وقت." },
    ],
  },
  {
    key: "ahmed",
    name: "أحمد رضا",
    handle: "ahmed",
    avatar: "/avatars/ahmed.jpg",
    presence: "online" as const,
    unread: 0,
    thread: [
      { sender: "me" as const, body: "أحمد، تقرير الأسبوع جاهز." },
      { sender: "them" as const, body: "ممتاز. نراجعو في مكالمة قصيرة؟" },
      { sender: "me" as const, body: "تمام، قولّي وقتك." },
    ],
  },
  {
    key: "maryam",
    name: "مريم الشريف",
    handle: "maryam",
    avatar: "/avatars/maryam.jpg",
    presence: "away" as const,
    unread: 0,
    thread: [
      { sender: "them" as const, body: "وصلتني الصور، واضحة جداً." },
      { sender: "me" as const, body: "الحمد لله. لو حابة نعدّل حاجة قولي." },
    ],
  },
];

export const AUTO_REPLIES = [
  "تمام، هرد عليك بعد شوية.",
  "وصلت، شكراً.",
  "ماشي يا فندم.",
  "أوكي، خلينا نتكلم في مكالمة لو الموضوع طويل.",
  "حاضر، هشوف وأكلمك.",
];
