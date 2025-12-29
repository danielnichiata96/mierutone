export interface Example {
  text: string;
  translation: string;
  pair?: string; // For minimal pairs
}

export type IconName = "wave" | "shuffle" | "hash" | "run" | "palette" | "map" | "chat" | "link";

export interface ExampleCategory {
  id: string;
  name: string;
  nameJp: string;
  iconName: IconName;
  description: string;
  items: Example[];
}

export const exampleCategories: ExampleCategory[] = [
  {
    id: "greetings",
    name: "Greetings",
    nameJp: "挨拶",
    iconName: "wave",
    description: "Essential daily greetings and polite expressions",
    items: [
      { text: "おはようございます", translation: "Good morning (polite)" },
      { text: "こんにちは", translation: "Hello" },
      { text: "こんばんは", translation: "Good evening" },
      { text: "おやすみなさい", translation: "Good night" },
      { text: "ありがとうございます", translation: "Thank you (polite)" },
      { text: "すみません", translation: "Excuse me / Sorry" },
      { text: "いただきます", translation: "Before eating" },
      { text: "ごちそうさまでした", translation: "After eating" },
      { text: "お元気ですか", translation: "How are you?" },
      { text: "はじめまして", translation: "Nice to meet you" },
    ],
  },
  {
    id: "minimal-pairs",
    name: "Minimal Pairs",
    nameJp: "同音異義語",
    iconName: "shuffle",
    description: "Same reading, different pitch - hear the difference in context",
    items: [
      { text: "箸で食べる", translation: "Eat with chopsticks (はし¹)", pair: "橋を渡る" },
      { text: "橋を渡る", translation: "Cross the bridge (はし²)", pair: "箸で食べる" },
      { text: "雨が降る", translation: "Rain falls (あめ¹)", pair: "飴を食べる" },
      { text: "飴を食べる", translation: "Eat candy (あめ⁰)", pair: "雨が降る" },
      { text: "柿が好き", translation: "Like persimmon (かき⁰)", pair: "牡蠣を食べる" },
      { text: "牡蠣を食べる", translation: "Eat oyster (かき¹)", pair: "柿が好き" },
      { text: "酒を飲む", translation: "Drink sake (さけ⁰)", pair: "鮭を食べる" },
      { text: "鮭を食べる", translation: "Eat salmon (さけ¹)", pair: "酒を飲む" },
    ],
  },
  {
    id: "numbers",
    name: "Numbers",
    nameJp: "数字",
    iconName: "hash",
    description: "Counting and number-related expressions",
    items: [
      { text: "一", translation: "One" },
      { text: "二", translation: "Two" },
      { text: "三", translation: "Three" },
      { text: "四", translation: "Four" },
      { text: "五", translation: "Five" },
      { text: "六", translation: "Six" },
      { text: "七", translation: "Seven" },
      { text: "八", translation: "Eight" },
      { text: "九", translation: "Nine" },
      { text: "十", translation: "Ten" },
      { text: "百", translation: "Hundred" },
      { text: "千", translation: "Thousand" },
    ],
  },
  {
    id: "verbs",
    name: "Common Verbs",
    nameJp: "動詞",
    iconName: "run",
    description: "Frequently used verbs in various forms",
    items: [
      { text: "食べる", translation: "To eat" },
      { text: "飲む", translation: "To drink" },
      { text: "行く", translation: "To go" },
      { text: "来る", translation: "To come" },
      { text: "見る", translation: "To see/watch" },
      { text: "聞く", translation: "To listen/ask" },
      { text: "話す", translation: "To speak" },
      { text: "読む", translation: "To read" },
      { text: "書く", translation: "To write" },
      { text: "買う", translation: "To buy" },
      { text: "する", translation: "To do" },
      { text: "ある", translation: "To exist (things)" },
      { text: "いる", translation: "To exist (living)" },
    ],
  },
  {
    id: "conjugations",
    name: "Verb Conjugations",
    nameJp: "動詞の活用",
    iconName: "link",
    description: "See how pitch changes across verb forms",
    items: [
      { text: "食べる", translation: "To eat (dictionary)" },
      { text: "食べます", translation: "To eat (polite)" },
      { text: "食べた", translation: "Ate (past)" },
      { text: "食べました", translation: "Ate (polite past)" },
      { text: "食べない", translation: "Don't eat (negative)" },
      { text: "食べて", translation: "Eating (te-form)" },
      { text: "行く", translation: "To go (dictionary)" },
      { text: "行きます", translation: "To go (polite)" },
      { text: "行った", translation: "Went (past)" },
      { text: "行きました", translation: "Went (polite past)" },
      { text: "行かない", translation: "Don't go (negative)" },
      { text: "行って", translation: "Going (te-form)" },
      { text: "する", translation: "To do (dictionary)" },
      { text: "します", translation: "To do (polite)" },
      { text: "した", translation: "Did (past)" },
      { text: "しない", translation: "Don't do (negative)" },
    ],
  },
  {
    id: "adjectives",
    name: "Adjectives",
    nameJp: "形容詞",
    iconName: "palette",
    description: "Common descriptive words",
    items: [
      { text: "大きい", translation: "Big" },
      { text: "小さい", translation: "Small" },
      { text: "高い", translation: "High/expensive" },
      { text: "安い", translation: "Cheap" },
      { text: "新しい", translation: "New" },
      { text: "古い", translation: "Old" },
      { text: "いい", translation: "Good" },
      { text: "悪い", translation: "Bad" },
      { text: "暑い", translation: "Hot (weather)" },
      { text: "寒い", translation: "Cold (weather)" },
    ],
  },
  {
    id: "places",
    name: "Places",
    nameJp: "場所",
    iconName: "map",
    description: "Common locations and proper nouns",
    items: [
      { text: "東京", translation: "Tokyo" },
      { text: "大阪", translation: "Osaka" },
      { text: "京都", translation: "Kyoto" },
      { text: "日本", translation: "Japan" },
      { text: "学校", translation: "School" },
      { text: "会社", translation: "Company" },
      { text: "駅", translation: "Station" },
      { text: "病院", translation: "Hospital" },
      { text: "銀行", translation: "Bank" },
      { text: "コンビニ", translation: "Convenience store" },
    ],
  },
  {
    id: "sentences",
    name: "Sentences",
    nameJp: "文",
    iconName: "chat",
    description: "Various sentence types to practice phrase-level pitch",
    items: [
      // Statements
      { text: "日本語を勉強しています", translation: "I am studying Japanese" },
      { text: "東京に住んでいます", translation: "I live in Tokyo" },
      // Questions
      { text: "何を食べたいですか", translation: "What do you want to eat?" },
      { text: "これはいくらですか", translation: "How much is this?" },
      // Requests
      { text: "ちょっと待ってください", translation: "Please wait a moment" },
      { text: "もう一度言ってください", translation: "Please say it again" },
      // Exclamations
      { text: "すごいですね", translation: "That's amazing!" },
      { text: "おいしそう", translation: "Looks delicious!" },
      // With minimal pair words
      { text: "箸で食べます", translation: "I eat with chopsticks (はし¹)" },
      { text: "橋を渡ります", translation: "I cross the bridge (はし²)" },
      // Casual
      { text: "ちょっと聞いてもいい", translation: "Can I ask you something?" },
      { text: "また明日ね", translation: "See you tomorrow!" },
    ],
  },
];

export function getCategoryById(id: string): ExampleCategory | undefined {
  return exampleCategories.find((cat) => cat.id === id);
}

export function getAllExamples(): Example[] {
  return exampleCategories.flatMap((cat) => cat.items);
}
