/**
 * Mock data for development when Supabase is not available
 */

export const mockCategories = [
  { id: '1', name: 'ベースメイク' },
  { id: '2', name: 'アイメイク' },
  { id: '3', name: 'リップ' },
  { id: '4', name: 'チーク' },
];

export const mockBrands = [
  { id: '1', name: 'Dior' },
  { id: '2', name: 'CHANEL' },
  { id: '3', name: 'MAC' },
  { id: '4', name: 'NARS' },
];

export const mockProducts = [
  {
    id: '1',
    name: 'ディオール アディクト リップ グロウ',
    brand_id: '1',
    category_id: '3',
    brand: { name: 'Dior' },
    category: { name: 'リップ' },
    image_url: '/placeholder.jpg',
  },
  {
    id: '2',
    name: 'シャネル レ ベージュ',
    brand_id: '2',
    category_id: '1',
    brand: { name: 'CHANEL' },
    category: { name: 'ベースメイク' },
    image_url: '/placeholder.jpg',
  },
  {
    id: '3',
    name: 'MAC ストロボクリーム',
    brand_id: '3',
    category_id: '1',
    brand: { name: 'MAC' },
    category: { name: 'ベースメイク' },
    image_url: '/placeholder.jpg',
  },
  {
    id: '4',
    name: 'NARS ラディアントクリーミーコンシーラー',
    brand_id: '4',
    category_id: '1',
    brand: { name: 'NARS' },
    category: { name: 'ベースメイク' },
    image_url: '/placeholder.jpg',
  },
];

export const mockPosts = [
  {
    id: '1',
    user_id: 'user_demo',
    content: '今日のメイク💄 春らしいピンクメイクに挑戦しました！',
    image_url: '/face_1.jpg',
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
    users: {
      id: 'user_demo',
      username: 'beauty_lover',
      name: 'Beauty Lover',
      bio: 'メイク大好き！毎日新しいメイクに挑戦中',
      profile_image: '/placeholder-user.jpg',
    },
    tags: [
      {
        id: '1',
        x: 30,
        y: 40,
        product_id: '1',
        products: mockProducts[0],
      },
    ],
    likes: [{ user_id: 'user_2' }],
    saves: [],
    isLiked: false,
    isSaved: false,
  },
  {
    id: '2',
    user_id: 'user_demo2',
    content: 'ナチュラルメイクの日✨ ベースメイクにこだわりました',
    image_url: '/face_2.jpg',
    created_at: '2024-02-29T10:00:00Z',
    updated_at: '2024-02-29T10:00:00Z',
    users: {
      id: 'user_demo2',
      username: 'natural_beauty',
      name: 'Natural Beauty',
      bio: 'ナチュラルメイクが好き',
      profile_image: '/placeholder-user.jpg',
    },
    tags: [
      {
        id: '2',
        x: 50,
        y: 50,
        product_id: '2',
        products: mockProducts[1],
      },
    ],
    likes: [{ user_id: 'user_1' }, { user_id: 'user_3' }],
    saves: [{ user_id: 'user_1' }],
    isLiked: false,
    isSaved: false,
  },
  {
    id: '3',
    user_id: 'user_demo3',
    content: 'オフィスメイク👩‍💼 プロフェッショナルに見えるように',
    image_url: '/face_3.jpg',
    created_at: '2024-02-28T10:00:00Z',
    updated_at: '2024-02-28T10:00:00Z',
    users: {
      id: 'user_demo3',
      username: 'office_style',
      name: 'Office Style',
      bio: 'オフィスメイクのアイデアをシェア',
      profile_image: '/placeholder-user.jpg',
    },
    tags: [
      {
        id: '3',
        x: 40,
        y: 60,
        product_id: '3',
        products: mockProducts[2],
      },
      {
        id: '4',
        x: 60,
        y: 40,
        product_id: '4',
        products: mockProducts[3],
      },
    ],
    likes: [],
    saves: [],
    isLiked: false,
    isSaved: false,
  },
];