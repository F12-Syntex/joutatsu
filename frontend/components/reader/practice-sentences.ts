// Predetermined Japanese sentences organized by difficulty level
// These will be randomized for practice

export interface PracticeSentence {
  text: string
  translation: string
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced'
}

export const practiceSentences: PracticeSentence[] = [
  // Beginner (N5 level)
  {
    text: 'これは本です。',
    translation: 'This is a book.',
    level: 'beginner',
  },
  {
    text: '私は学生です。',
    translation: 'I am a student.',
    level: 'beginner',
  },
  {
    text: '今日は天気がいいです。',
    translation: 'The weather is nice today.',
    level: 'beginner',
  },
  {
    text: '猫が好きです。',
    translation: 'I like cats.',
    level: 'beginner',
  },
  {
    text: '毎日日本語を勉強します。',
    translation: 'I study Japanese every day.',
    level: 'beginner',
  },
  {
    text: '朝ごはんを食べました。',
    translation: 'I ate breakfast.',
    level: 'beginner',
  },
  {
    text: '駅はどこですか。',
    translation: 'Where is the station?',
    level: 'beginner',
  },
  {
    text: '水を飲みたいです。',
    translation: 'I want to drink water.',
    level: 'beginner',
  },

  // Elementary (N4 level)
  {
    text: '昨日友達と映画を見に行きました。',
    translation: 'Yesterday I went to see a movie with my friend.',
    level: 'elementary',
  },
  {
    text: '日本語を話すことができます。',
    translation: 'I can speak Japanese.',
    level: 'elementary',
  },
  {
    text: '窓を開けてもいいですか。',
    translation: 'May I open the window?',
    level: 'elementary',
  },
  {
    text: '電車に乗る前に切符を買わなければなりません。',
    translation: 'You must buy a ticket before getting on the train.',
    level: 'elementary',
  },
  {
    text: '彼女は歌が上手だと思います。',
    translation: 'I think she is good at singing.',
    level: 'elementary',
  },
  {
    text: 'この本は読みやすいです。',
    translation: 'This book is easy to read.',
    level: 'elementary',
  },
  {
    text: '雨が降りそうです。',
    translation: 'It looks like it will rain.',
    level: 'elementary',
  },
  {
    text: '先生に質問されました。',
    translation: 'I was asked a question by the teacher.',
    level: 'elementary',
  },

  // Intermediate (N3 level)
  {
    text: '彼は約束を守らないので、信用できません。',
    translation: "He doesn't keep his promises, so I can't trust him.",
    level: 'intermediate',
  },
  {
    text: '経験を積むにつれて、仕事が楽になってきた。',
    translation: 'As I gained experience, work became easier.',
    level: 'intermediate',
  },
  {
    text: 'この問題は難しすぎて、誰も解けなかった。',
    translation: 'This problem was too difficult; no one could solve it.',
    level: 'intermediate',
  },
  {
    text: '健康のために、毎日運動するようにしています。',
    translation: 'For my health, I try to exercise every day.',
    level: 'intermediate',
  },
  {
    text: '忙しいにもかかわらず、彼女は手伝ってくれた。',
    translation: 'Despite being busy, she helped me.',
    level: 'intermediate',
  },
  {
    text: 'その映画は見る価値があると言われている。',
    translation: 'That movie is said to be worth watching.',
    level: 'intermediate',
  },
  {
    text: '調査の結果、原因が明らかになった。',
    translation: 'As a result of the investigation, the cause became clear.',
    level: 'intermediate',
  },
  {
    text: '彼の説明を聞いて、やっと理解できた。',
    translation: 'After hearing his explanation, I finally understood.',
    level: 'intermediate',
  },

  // Advanced (N2-N1 level)
  {
    text: '環境問題に対する意識が高まるにつれ、企業の取り組みも変化してきている。',
    translation: 'As awareness of environmental issues grows, corporate initiatives are also changing.',
    level: 'advanced',
  },
  {
    text: '彼の発言は誤解を招きかねないので、慎重に対応すべきだ。',
    translation: 'His remarks could cause misunderstanding, so we should respond carefully.',
    level: 'advanced',
  },
  {
    text: '技術革新が進むにしたがって、従来の職業が姿を消しつつある。',
    translation: 'As technological innovation advances, traditional occupations are disappearing.',
    level: 'advanced',
  },
  {
    text: '効率を追求するあまり、品質が犠牲になることがある。',
    translation: 'In the excessive pursuit of efficiency, quality can sometimes be sacrificed.',
    level: 'advanced',
  },
  {
    text: '批判を受けたからといって、方針を変えるわけにはいかない。',
    translation: "Just because we received criticism doesn't mean we can change our policy.",
    level: 'advanced',
  },
  {
    text: '長年の研究の末、ついに新薬の開発に成功した。',
    translation: 'After years of research, they finally succeeded in developing a new drug.',
    level: 'advanced',
  },
  {
    text: '彼女の功績なくしては、このプロジェクトの成功はあり得なかった。',
    translation: "Without her achievements, the success of this project would not have been possible.",
    level: 'advanced',
  },
  {
    text: '国際社会における日本の役割について、さまざまな議論がなされている。',
    translation: "Various discussions are being held about Japan's role in the international community.",
    level: 'advanced',
  },
]

export function getRandomSentence(level?: PracticeSentence['level']): PracticeSentence {
  const filtered = level
    ? practiceSentences.filter((s) => s.level === level)
    : practiceSentences

  return filtered[Math.floor(Math.random() * filtered.length)]
}

export function getRandomSentences(
  count: number,
  level?: PracticeSentence['level']
): PracticeSentence[] {
  const filtered = level
    ? practiceSentences.filter((s) => s.level === level)
    : practiceSentences

  const shuffled = [...filtered].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
