import type { Post } from '../types';

/**
 * Mock posts for visual preview.
 * Photos are placeholder gradients in base64.
 */
export const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    author: 'me',
    content: '今天是我们在一起的第100天！一起去吃了那家心心念念的日料 🍣 真的超级幸福',
    photos: [],
    mood: '🥰',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    reactions: {},
  },
  {
    id: 'mock-2',
    author: 'partner',
    content: '某人今天偷偷来接我下班，还带了奶茶 🧋 被惊喜到了嘿嘿',
    photos: [],
    mood: '😋',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    reactions: {},
  },
  {
    id: 'mock-3',
    author: 'me',
    content: '周末一起去了海边 🌊 天气超好，拍了好多照片！已经开始期待下一次旅行了',
    photos: [],
    mood: '🤩',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    reactions: {},
  },
  {
    id: 'mock-4',
    author: 'partner',
    content: '今天一起在家做饭，虽然把厨房弄得一团糟但是超开心！他做的番茄炒蛋居然比我的好吃 😤😂',
    photos: [],
    mood: '😊',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    reactions: {},
  },
  {
    id: 'mock-5',
    author: 'me',
    content: '第一次一起看电影 🎬 选了一部爱情片，结果两个人都哭得稀里哗啦的...',
    photos: [],
    mood: '😌',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    reactions: {},
  },
  {
    id: 'mock-6',
    author: 'partner',
    content: '他说要给我一个惊喜，结果是买了一对情侣手链 🥺 上面刻了我们的名字缩写... 这谁顶得住啊',
    photos: [],
    mood: '🥰',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    reactions: {},
  },
];
