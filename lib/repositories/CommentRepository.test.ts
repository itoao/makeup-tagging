import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'; // Mock をインポート
// Import all functions to be tested
import { findCommentsByPostId, createComment, updateComment, deleteComment } from './CommentRepository';
import type { Comment } from '@/src/types/post';
import type { Database } from '@/src/types/supabase';

// モックデータ用の型定義
type CommentRow = Database['public']['Tables']['Comment']['Row'];
type UserRow = Database['public']['Tables']['User']['Row'];

type CommentWithUser = CommentRow & {
  user: Pick<UserRow, 'id' | 'username' | 'name' | 'image'> | null;
};

// Supabaseクライアントのモック設定 (各メソッドも vi.fn() でラップ)
vi.mock('@/lib/supabase', () => ({
  default: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

// モックされたSupabaseクライアントをインポート
import supabase from '@/lib/supabase';

// モックの型付けはシンプルに (as any を使うため厳密さは不要)
const mockSupabase = supabase as any; // any 型にキャスト

describe('CommentRepository', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Use resetAllMocks for better isolation

    // モックの再設定は各テストケース内で行う
    // This avoids complex reset logic here and ensures mocks are specific to each test
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
      // Arrange: モックチェーンの最終結果を設定
      const mockRange = vi.fn().mockResolvedValueOnce({ data: mockCommentData, error: null, count: mockTotalCount });

      // Arrange: from().select().eq().order().range() のチェーンをモック
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

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
        createdAt: mockCommentData[0].created_at,
        // updatedAt: mockCommentData[0].updated_at, // Comment out: updatedAt is not in Comment type
        user: { id: mockUserId1, username: 'user_abc', name: 'User ABC', image: 'abc.jpg' },
      }));
      // 2件目のデータマッピング検証
      expect(comments[1].user?.username).toBe('user_def');
      // Supabaseクライアント呼び出し検証
      // 実装コードからコピーした select 文 (改行・インデント含む)
      const expectedSelect = `
    id,
    content,
    userId,
    postId,
    created_at,
    user:User ( id, username, name, image )
  `;
      expect(mockSupabase.from).toHaveBeenCalledWith('Comment');
      // モックされたメソッド呼び出しを検証
      // expect.stringMatching をやめ、実装からコピーした文字列で直接比較
      expect(mockSelect).toHaveBeenCalledWith(expectedSelect, { count: 'exact' });
      expect(mockEq).toHaveBeenCalledWith('postId', mockPostId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(mockRange).toHaveBeenCalledWith(0, 9);
    });

    it('ページネーションオプションが適用されるべき', async () => {
      // Arrange: モックチェーンの最終結果を設定 (range の引数検証が目的)
      const mockRange = vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 15 });

      // Arrange: from().select().eq().order().range() のチェーンをモック
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);
      const options = { page: 2, limit: 5 };

      // Act: ページネーションオプションを指定して実行
      await findCommentsByPostId(mockPostId, options);

      // Assert: rangeメソッドが正しい引数で呼び出されたか
      expect(mockRange).toHaveBeenCalledWith(5, 9); // page=2, limit=5 => from=5, to=9
    });

    it('Supabaseの取得処理でエラーが発生した場合、エラーを返すべき', async () => {
      // Arrange: モックチェーンの最終結果を設定 (range がエラーを返す)
      const mockError = { message: 'DB Error' }; // Supabaseエラーは通常オブジェクト
      const mockRange = vi.fn().mockResolvedValueOnce({ data: null, error: mockError, count: null });

      // Arrange: from().select().eq().order().range() のチェーンをモック
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      // Act: 関数を実行
      const { comments, total, error } = await findCommentsByPostId(mockPostId);

      // Assert: エラーオブジェクトが返され、データが空であることを確認
      expect(error?.message).toEqual(mockError.message); // エラーメッセージを比較
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
      // Arrange: Mock the insert().select().single() chain
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: mockCreatedCommentData, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      // Arrange: from() returns the insert chain
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      // Act: テスト対象の関数を実行
      const { comment, error } = await createComment(mockPostId, mockUserId, mockContent);

      // Assert: 結果を検証
      expect(error).toBeNull(); // エラーがないこと
      expect(comment).toBeDefined(); // commentオブジェクトが存在すること
      expect(comment?.id).toBe(mockNewCommentId); // IDが正しいこと
      expect(comment?.content).toBe(mockContent); // 内容が正しいこと
      expect(comment?.userId).toBe(mockUserId); // ユーザーIDが正しいこと
      expect(comment?.postId).toBe(mockPostId); // 投稿IDが正しいこと
      expect(comment?.user?.username).toBe('commenter');
      expect(comment?.createdAt).toBe(mockCreatedCommentData.created_at);
      // updatedAt は Comment 型に含まれないためコメントアウト
      // expect(comment?.updatedAt).toBe(mockCreatedCommentData.updated_at);

      // Supabaseクライアント呼び出し検証
      expect(mockSupabase.from).toHaveBeenCalledWith('Comment');
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Chain is called once

      // Verify the chain calls
      expect(mockInsert).toHaveBeenCalledWith({ postId: mockPostId, userId: mockUserId, content: mockContent });

      // Verify the select statement used in the chain
      const expectedSelect = `
    id,
    content,
    userId,
    postId,
    created_at,
    user:User ( id, username, name, image )
  `;
      expect(mockSelect).toHaveBeenCalledWith(expectedSelect);
      expect(mockSingle).toHaveBeenCalledTimes(1);
    });
    // }); // Remove incorrect closing bracket here - This was the syntax error

    // Test case moved outside the previous 'it' block
    // Removed: This test case is covered by the 'Supabaseの挿入/選択処理でエラーが発生した場合' test below
    // it('挿入後のデータ取得(select full comment)でエラーが発生した場合、エラーを返すべき', async () => { ... });

    it('Supabaseの挿入/選択処理でエラーが発生した場合 (insert().select().single() fails)、エラーを返すべき', async () => {
      // Arrange: Mock the insert().select().single() chain to return an error
      const mockUpsertError = { message: 'DB constraint violation' };
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: null, error: mockUpsertError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      // Arrange: from() returns the insert chain
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      // Act: 関数を実行
      const { comment, error } = await createComment(mockPostId, mockUserId, mockContent);

      // Assert: エラーが返され、commentがnullであることを確認
      // Check if the error message includes the original Supabase error message
      // Repository now returns a generic message, specific error is logged internally
      expect(error?.message).toEqual('コメントの作成に失敗しました (repository error)');
      expect(comment).toBeNull();

      // Verify the chain was called
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockSelect).toHaveBeenCalledTimes(1);
      expect(mockSingle).toHaveBeenCalledTimes(1);
    });

    it('挿入/選択処理が成功してもデータがnullの場合 (insert().select().single() returns null data)、エラーを返すべき', async () => {
      // Arrange: Mock the insert().select().single() chain to return null data without error
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: null, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      // Arrange: from() returns the insert chain
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      // Act: 関数を実行
      const { comment, error } = await createComment(mockPostId, mockUserId, mockContent);

      // Assert: 特定のエラーメッセージが返されることを確認 (実装に合わせる)
      expect(error?.message).toEqual('コメントの作成に失敗しました (repository error)'); // Consistent error message
      expect(comment).toBeNull();

      // Verify the chain was called
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockSelect).toHaveBeenCalledTimes(1);
      expect(mockSingle).toHaveBeenCalledTimes(1);
    });

    it('データマッピング中にエラーが発生した場合、エラーを返すべき', async () => {
        // Arrange: Mock the insert().select().single() chain to return data that causes mapping error
        const invalidCommentData = { ...mockCreatedCommentData, user: 'invalid-user-data' }; // Malformed user data
        const mockSingle = vi.fn().mockResolvedValueOnce({ data: invalidCommentData, error: null });
        const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
        const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
        mockSupabase.from.mockReturnValue({ insert: mockInsert });

        // Act
        const { comment, error } = await createComment(mockPostId, mockUserId, mockContent);

        // Assert
        expect(comment).toBeNull();
        expect(error).toBeDefined();
        expect(error?.message).toEqual('コメントの作成に失敗しました (repository error)'); // Consistent error message
        expect(mockSingle).toHaveBeenCalledTimes(1); // Ensure the chain was called
    });
  });

  // --- updateComment ---
  describe('updateComment', () => {
    // Arrange: テストデータ準備
    const mockCommentId = 'comment-to-update';
    const mockUserId = 'owner-user';
    const mockOtherUserId = 'other-user';
    const mockContent = 'Updated content';
    const mockExistingComment = { userId: mockUserId }; // Only need userId for ownership check
    const mockUpdatedCommentData: CommentWithUser = {
      id: mockCommentId,
      content: mockContent,
      userId: mockUserId,
      postId: 'post-abc',
      created_at: new Date(Date.now() - 5000).toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: mockUserId, username: 'owner', name: 'Owner User', image: 'owner.jpg' },
    };

    it('コメント所有者が正常にコメントを更新できるべき', async () => {
      // Arrange: Mock ownership check: select('userId').eq().single()
      const mockSingleOwnerCheck = vi.fn().mockResolvedValueOnce({ data: mockExistingComment, error: null });
      const mockEqOwnerCheck = vi.fn().mockReturnValue({ single: mockSingleOwnerCheck });
      const mockSelectOwnerCheck = vi.fn().mockReturnValue({ eq: mockEqOwnerCheck });

      // Arrange: Mock update chain: update().eq().select(*).single()
      const mockSingleUpdate = vi.fn().mockResolvedValueOnce({ data: mockUpdatedCommentData, error: null });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      // Arrange: from の呼び出しに応じて返すオブジェクトを切り替え
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'Comment') {
          // 最初の呼び出しは所有者確認 (select)、2回目は更新 (update)
          if ((mockSupabase.from as Mock).mock.calls.length <= 1) {
            return { select: mockSelectOwnerCheck };
          } else {
            return { update: mockUpdate };
          }
        }
        return {};
      });

      // Act: 関数を実行
      const { comment, error } = await updateComment(mockCommentId, mockUserId, mockContent);

      // Assert: 結果を検証
      expect(error).toBeNull();
      expect(comment).toBeDefined();
      expect(comment?.id).toBe(mockCommentId);
      expect(comment?.content).toBe(mockContent);
      expect(comment?.user?.username).toBe('owner');

      // Supabaseクライアント呼び出し検証
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('Comment');

      // 1. Ownership check chain
      expect(mockSelectOwnerCheck).toHaveBeenCalledWith('userId');
      expect(mockEqOwnerCheck).toHaveBeenCalledWith('id', mockCommentId);
      expect(mockSingleOwnerCheck).toHaveBeenCalledTimes(1);

      // 2. Update chain
      expect(mockUpdate).toHaveBeenCalledWith({ content: mockContent, updated_at: expect.any(String) });
      expect(mockEqUpdate).toHaveBeenCalledWith('id', mockCommentId);
      // 実装コードからコピーした select 文
      const expectedSelect = `
    id,
    content,
    userId,
    postId,
    created_at,
    updated_at,
    user:User ( id, username, name, image )
  `;
      // expect.stringMatching をやめ、実装からコピーした文字列で直接比較
      expect(mockSelectUpdate).toHaveBeenCalledWith(expectedSelect);
      expect(mockSingleUpdate).toHaveBeenCalledTimes(1);
    });

    it('コメントが見つからない場合 (owner check fails with PGRST116)、エラーを返すべき', async () => {
      // Arrange: 所有者確認の select -> eq -> single が 'Not found' エラーを返す
      const notFoundError = { code: 'PGRST116', message: 'Not found' };
      const mockSingleOwnerCheck = vi.fn().mockResolvedValueOnce({ data: null, error: notFoundError });
      const mockEqOwnerCheck = vi.fn(() => ({ single: mockSingleOwnerCheck }));
      const mockSelectOwnerCheck = vi.fn(() => ({ eq: mockEqOwnerCheck }));
      const mockUpdate = vi.fn(); // Update should not be called

      // Arrange: from は所有者確認の select チェーンのみを返す
      mockSupabase.from.mockReturnValue({ select: mockSelectOwnerCheck } as any);

      // Act: 関数を実行
      const { comment, error } = await updateComment(mockCommentId, mockUserId, mockContent);

      // Assert: 特定のエラーメッセージが返されること (実装に合わせる)
      expect(error?.message).toEqual('コメントが見つかりません。'); // 実装のエラーメッセージ
      expect(comment).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockSingleOwnerCheck).toHaveBeenCalledTimes(1); // Only owner check single()
    });

    it('コメント所有者でない場合、権限エラーを返すべき', async () => {
      // Arrange: 所有者確認の select -> eq -> single が異なるuserIdを返す
      const mockSingleOwnerCheck = vi.fn().mockResolvedValueOnce({ data: { userId: mockOtherUserId }, error: null });
      const mockEqOwnerCheck = vi.fn(() => ({ single: mockSingleOwnerCheck }));
      const mockSelectOwnerCheck = vi.fn(() => ({ eq: mockEqOwnerCheck }));
      const mockUpdate = vi.fn(); // Update should not be called

      // Arrange: from は所有者確認の select チェーンのみを返す
      mockSupabase.from.mockReturnValue({ select: mockSelectOwnerCheck } as any);

      // Act: 関数を実行
      const { comment, error } = await updateComment(mockCommentId, mockUserId, mockContent);

      // Assert: 特定のエラーメッセージが返されること (実装に合わせる)
      expect(error?.message).toEqual('このコメントを編集する権限がありません。'); // 実装のエラーメッセージ
      expect(comment).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockSingleOwnerCheck).toHaveBeenCalledTimes(1);
    });

    it('Supabaseの更新処理でエラーが発生した場合 (update chain fails)、エラーを返すべき', async () => {
      // Arrange: 所有者確認は成功
      const mockSingleOwnerCheck = vi.fn().mockResolvedValueOnce({ data: mockExistingComment, error: null });
      const mockEqOwnerCheck = vi.fn().mockReturnValue({ single: mockSingleOwnerCheck });
      const mockSelectOwnerCheck = vi.fn().mockReturnValue({ eq: mockEqOwnerCheck });

      // Arrange: update().eq().select().single() がエラーを返す
      const mockUpdateError = { message: 'Update failed' };
      const mockSingleUpdate = vi.fn().mockResolvedValueOnce({ data: null, error: mockUpdateError });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      // Arrange: from の呼び出しに応じて返すオブジェクトを切り替え
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'Comment') {
          if ((mockSupabase.from as Mock).mock.calls.length <= 1) {
            return { select: mockSelectOwnerCheck };
          } else {
            return { update: mockUpdate };
          }
        }
        return {};
      });

      // Act: 関数を実行
      const { comment, error } = await updateComment(mockCommentId, mockUserId, mockContent);

      // Assert: updateエラーが返されること
      expect(error?.message).toEqual(mockUpdateError.message); // Compare message
      expect(comment).toBeNull();
      expect(mockUpdate).toHaveBeenCalled(); // update は呼ばれる
      expect(mockSingleOwnerCheck).toHaveBeenCalledTimes(1); // 所有者確認は呼ばれる
      expect(mockSingleUpdate).toHaveBeenCalledTimes(1); // update チェーンの single も呼ばれる
    });
  });

  // --- deleteComment ---
  describe('deleteComment', () => {
    // Arrange: テストデータ準備
    const mockCommentId = 'comment-to-delete';
    const mockUserId = 'owner-user';
    const mockOtherUserId = 'other-user';
    const mockExistingComment = { userId: mockUserId };

    it('コメント所有者が正常にコメントを削除できるべき', async () => {
      // Arrange: 所有者確認の select -> eq -> single が成功
      const mockSingleOwnerCheck = vi.fn().mockResolvedValueOnce({ data: mockExistingComment, error: null });
      const mockEqOwnerCheck = vi.fn().mockReturnValue({ single: mockSingleOwnerCheck }); // Use mockReturnValue
      const mockSelectOwnerCheck = vi.fn().mockReturnValue({ eq: mockEqOwnerCheck }); // Use mockReturnValue

      // Arrange: delete -> eq が成功 (error: null を返す)
      const mockEqDelete = vi.fn().mockResolvedValueOnce({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEqDelete }); // Use mockReturnValue

      // Arrange: from の呼び出しに応じて返すオブジェクトを切り替え
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'Comment') {
          // 最初の呼び出しは所有者確認 (select)、2回目は削除 (delete)
          if ((mockSupabase.from as Mock).mock.calls.length <= 1) {
            return { select: mockSelectOwnerCheck };
          } else {
            return { delete: mockDelete };
          }
        }
        return {};
      });

      // Act: 関数を実行
      const { error } = await deleteComment(mockCommentId, mockUserId);

      // Assert: 結果を検証
      expect(error).toBeNull();

      // Supabaseクライアント呼び出し検証
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('Comment');

      // 1. Ownership check chain
      expect(mockSelectOwnerCheck).toHaveBeenCalledWith('userId');
      expect(mockEqOwnerCheck).toHaveBeenCalledWith('id', mockCommentId);
      expect(mockSingleOwnerCheck).toHaveBeenCalledTimes(1);

      // 2. Delete chain
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEqDelete).toHaveBeenCalledWith('id', mockCommentId);
    });

    it('コメントが見つからない場合 (owner check fails with PGRST116)、エラーなく完了すべき', async () => {
      // Arrange: 所有者確認の select -> eq -> single が 'Not found' エラーを返す
      const notFoundError = { code: 'PGRST116', message: 'Not found' };
      const mockSingleOwnerCheck = vi.fn().mockResolvedValueOnce({ data: null, error: notFoundError });
      const mockEqOwnerCheck = vi.fn().mockReturnValue({ single: mockSingleOwnerCheck }); // Use mockReturnValue
      const mockSelectOwnerCheck = vi.fn().mockReturnValue({ eq: mockEqOwnerCheck }); // Use mockReturnValue
      const mockDelete = vi.fn(); // Delete should not be called

      // Arrange: from は所有者確認の select チェーンのみを返す
      mockSupabase.from.mockReturnValue({ select: mockSelectOwnerCheck } as any);

      // Act: 関数を実行
      const { error } = await deleteComment(mockCommentId, mockUserId);

      // Assert: エラーがないこと (実装のロジックに合わせる)
      expect(error).toBeNull();
      expect(mockDelete).not.toHaveBeenCalled(); // deleteは呼ばれない
      expect(mockSingleOwnerCheck).toHaveBeenCalledTimes(1);
    });

    it('コメント所有者でない場合、権限エラーを返すべき', async () => {
      // Arrange: 所有者確認の select -> eq -> single が異なるuserIdを返す
      const mockSingleOwnerCheck = vi.fn().mockResolvedValueOnce({ data: { userId: mockOtherUserId }, error: null });
      const mockEqOwnerCheck = vi.fn().mockReturnValue({ single: mockSingleOwnerCheck }); // Use mockReturnValue
      const mockSelectOwnerCheck = vi.fn().mockReturnValue({ eq: mockEqOwnerCheck }); // Use mockReturnValue
      const mockDelete = vi.fn(); // delete は呼ばれないはず

      // Arrange: from は所有者確認の select チェーンのみを返す
      mockSupabase.from.mockReturnValue({ select: mockSelectOwnerCheck } as any);

      // Act: 関数を実行
      const { error } = await deleteComment(mockCommentId, mockUserId);

      // Assert: 特定のエラーメッセージが返されること (実装に合わせる)
      expect(error?.message).toEqual('このコメントを削除する権限がありません。');
      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockSingleOwnerCheck).toHaveBeenCalledTimes(1);
    });

    it('Supabaseの削除処理でエラーが発生した場合 (delete chain fails)、エラーを返すべき', async () => {
      // Arrange: 所有者確認は成功
      const mockSingleOwnerCheck = vi.fn().mockResolvedValueOnce({ data: mockExistingComment, error: null });
      const mockEqOwnerCheck = vi.fn().mockReturnValue({ single: mockSingleOwnerCheck }); // Use mockReturnValue
      const mockSelectOwnerCheck = vi.fn().mockReturnValue({ eq: mockEqOwnerCheck }); // Use mockReturnValue

      // Arrange: delete -> eq がエラーを返す
      const mockDeleteError = { message: 'Delete failed' };
      const mockEqDelete = vi.fn().mockResolvedValueOnce({ error: mockDeleteError });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEqDelete }); // Use mockReturnValue

      // Arrange: from の呼び出しに応じて返すオブジェクトを切り替え
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'Comment') {
          // 最初の呼び出しは所有者確認 (select)、2回目は削除 (delete)
          if ((mockSupabase.from as Mock).mock.calls.length <= 1) {
            return { select: mockSelectOwnerCheck };
          } else {
            return { delete: mockDelete };
          }
        }
        return {};
      });

      // Act: 関数を実行（所有者で実行することでdeleteに到達する）
      const { error } = await deleteComment(mockCommentId, mockUserId);

      // Assert: deleteエラーが返されること
      expect(error?.message).toEqual(mockDeleteError.message); // Compare message
      expect(mockDelete).toHaveBeenCalledTimes(1); // delete は呼ばれる
      expect(mockSingleOwnerCheck).toHaveBeenCalledTimes(1); // 所有者確認は呼ばれる
      expect(mockEqDelete).toHaveBeenCalledTimes(1); // delete チェーンの eq も呼ばれる
    });
  });
}); // Close describe('CommentRepository')
// This line was likely the cause of the syntax error. Removed.
