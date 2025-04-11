import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findCommentsByPostId, createComment } from './CommentRepository';
import type { Comment } from '@/src/types/post';
import type { Database } from '@/src/types/supabase';

// モックデータ用の型定義
type CommentRow = Database['public']['Tables']['Comment']['Row'];
type UserRow = Database['public']['Tables']['User']['Row'];

type CommentWithUser = CommentRow & {
  user: Pick<UserRow, 'id' | 'username' | 'name' | 'image'> | null;
};

// Supabaseクライアントのモック設定
vi.mock('@/lib/supabase', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
  mockSupabaseClient.select.mockImplementation(() => mockSupabaseClient);
  return { default: mockSupabaseClient };
});

// モックされたSupabaseクライアントをインポート
import supabase from '@/lib/supabase';
const mockSupabaseClient = supabase as unknown as {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

describe('CommentRepository', () => {
  // 各テストの前にモックをリセット
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトのモック実装
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockImplementation(() => mockSupabaseClient);
    mockSupabaseClient.order.mockReturnThis();
    mockSupabaseClient.range.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.insert.mockResolvedValue({ data: [{ id: 'mock-id' }], error: null });
    mockSupabaseClient.range.mockResolvedValue({ data: [], error: null, count: 0 }); // Default for findMany
  });

  // --- findCommentsByPostId ---
  describe('findCommentsByPostId', () => {
    // テストデータ準備 (Arrange)
    const mockPostId = 'post-123';
    const mockUserId1 = 'user-abc';
    const mockUserId2 = 'user-def';
    const now = new Date();
    const past = new Date(now.getTime() - 10000);
    // モックデータに updated_at を追加
    const mockCommentData: CommentWithUser[] = [
      { id: 'comment-1', content: 'Comment 1', userId: mockUserId1, postId: mockPostId, created_at: past.toISOString(), updated_at: past.toISOString(), user: { id: mockUserId1, username: 'user_abc', name: 'User ABC', image: 'abc.jpg' } },
      { id: 'comment-2', content: 'Comment 2', userId: mockUserId2, postId: mockPostId, created_at: now.toISOString(), updated_at: now.toISOString(), user: { id: mockUserId2, username: 'user_def', name: 'User DEF', image: 'def.jpg' } },
    ];
    const mockTotalCount = 5;

    it('指定された投稿IDのコメントリストをページネーション付きで取得し、正しくマッピングされるべき', async () => {
      // Arrange: rangeメソッドがテストデータを返すように設定
      mockSupabaseClient.range.mockResolvedValueOnce({ data: mockCommentData, error: null, count: mockTotalCount });
      const options = { page: 1, limit: 10 };

      // Act: テスト対象の関数を実行
      const { comments, total, error } = await findCommentsByPostId(mockPostId, options);

      // Assert: 結果を検証
      expect(error).toBeNull(); // エラーがないこと
      expect(total).toBe(mockTotalCount); // 総件数が正しいこと
      expect(comments).toHaveLength(mockCommentData.length); // 取得件数が正しいこと
      // 1件目のデータマッピング検証
      expect(comments[0]).toEqual(expect.objectContaining({
        id: 'comment-1',
        content: 'Comment 1',
        userId: mockUserId1,
        postId: mockPostId,
        createdAt: mockCommentData[0].created_at, // createdAtがマッピングされているか
        user: { id: mockUserId1, username: 'user_abc', name: 'User ABC', image: 'abc.jpg' },
      }));
      // 2件目のデータマッピング検証
      expect(comments[1].user?.username).toBe('user_def');
      // Supabaseクライアント呼び出し検証
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Comment');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.any(String), { count: 'exact' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('postId', mockPostId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: true }); // 時系列順
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9); // page=1, limit=10
    });

    it('ページネーションオプションが適用されるべき', async () => {
      // Arrange: rangeメソッドの呼び出し引数検証が目的
      mockSupabaseClient.range.mockResolvedValueOnce({ data: [], error: null, count: 15 });
      const options = { page: 2, limit: 5 };

      // Act: ページネーションオプションを指定して実行
      await findCommentsByPostId(mockPostId, options);

      // Assert: rangeメソッドが正しい引数で呼び出されたか
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(5, 9); // page=2, limit=5 => from=5, to=9
    });

    it('Supabaseの取得処理でエラーが発生した場合、エラーを返すべき', async () => {
      // Arrange: rangeメソッドがエラーを返すように設定
      const mockError = new Error('DB Error');
      mockSupabaseClient.range.mockResolvedValueOnce({ data: null, error: mockError, count: null });

      // Act: 関数を実行
      const { comments, total, error } = await findCommentsByPostId(mockPostId);

      // Assert: エラーオブジェクトが返され、データが空であることを確認
      expect(error).toEqual(mockError);
      expect(comments).toEqual([]);
      expect(total).toBe(0);
    });
  });

  // --- createComment ---
  describe('createComment', () => {
    // テストデータ準備 (Arrange)
    const mockPostId = 'post-for-comment';
    const mockUserId = 'commenter-user';
    const mockContent = 'This is a new comment.';
    const mockNewCommentId = 'new-comment-id';
    // insert後にselectで取得される想定のデータ (updated_at を追加)
    const mockCreatedCommentData: CommentWithUser = {
      id: mockNewCommentId,
      content: mockContent,
      userId: mockUserId,
      postId: mockPostId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), // Add updated_at
      user: { id: mockUserId, username: 'commenter', name: 'Commenter User', image: 'commenter.jpg' },
    };

    it('コメントを正常に作成し、ユーザー情報を含めてマッピングされたデータを返すべき', async () => {
      // Arrange: insert が作成データを返し、select -> single が作成されたデータを返すように設定
      mockSupabaseClient.insert.mockResolvedValueOnce({ data: [{ id: mockNewCommentId }], error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockCreatedCommentData, error: null });

      // Act: テスト対象の関数を実行
      const { comment, error } = await createComment(mockPostId, mockUserId, mockContent);

      // Assert: 結果を検証
      expect(error).toBeNull(); // エラーがないこと
      expect(comment).toBeDefined(); // commentオブジェクトが存在すること
      expect(comment?.id).toBe(mockNewCommentId); // IDが正しいこと
      expect(comment?.content).toBe(mockContent); // 内容が正しいこと
      expect(comment?.userId).toBe(mockUserId); // ユーザーIDが正しいこと
      expect(comment?.postId).toBe(mockPostId); // 投稿IDが正しいこと
      expect(comment?.user?.username).toBe('commenter'); // ユーザー情報がマッピングされていること
      expect(comment?.createdAt).toBe(mockCreatedCommentData.created_at); // createdAtがマッピングされていること
      // Supabaseクライアント呼び出し検証
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('Comment');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({ postId: mockPostId, userId: mockUserId, content: mockContent }); // insertの引数を確認
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(expect.any(String)); // selectの呼び出しを確認
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1); // singleが呼ばれたか
    });

    it('Supabaseの挿入処理でエラーが発生した場合、エラーを返すべき', async () => {
      // Arrange: insert がエラーを返すように設定
      const mockInsertError = new Error('Insert failed');
      mockSupabaseClient.insert.mockResolvedValueOnce({ data: null, error: mockInsertError });

      // Act: 関数を実行
      const { comment, error } = await createComment(mockPostId, mockUserId, mockContent);

      // Assert: エラーが返され、commentがnullであることを確認
      expect(error).toEqual(mockInsertError);
      expect(comment).toBeNull();
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(0);
    });

    it('挿入後のデータ取得でデータがnullの場合、エラーを返すべき', async () => {
      // Arrange: insert が空の配列を返すように設定
      mockSupabaseClient.insert.mockResolvedValueOnce({ data: [], error: null });

      // Act: 関数を実行
      const { comment, error } = await createComment(mockPostId, mockUserId, mockContent);

      // Assert: 特定のエラーメッセージが返されることを確認
      expect(error).toEqual(new Error('Failed to create comment.'));
      expect(comment).toBeNull();
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(0);
    });
  });
});
