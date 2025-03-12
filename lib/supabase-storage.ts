import supabase from './supabase';

/**
 * 画像をSupabaseのストレージにアップロードする
 * @param file アップロードするファイル
 * @param bucket バケット名
 * @param path ファイルパス（オプション）
 * @returns アップロードされたファイルのURLまたはエラー
 */
export async function uploadImage(
  file: File,
  bucket: string = 'images',
  path: string = ''
): Promise<{ url: string } | { error: string }> {
  try {
    // ファイル名を生成（一意のIDを含む）
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // ファイルをアップロード
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { error: uploadError.message };
    }

    // 公開URLを取得
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return { error: 'ファイルのアップロードに失敗しました' };
  }
}

/**
 * Supabaseのストレージから画像を削除する
 * @param url 削除する画像のURL
 * @param bucket バケット名
 * @returns 成功またはエラーメッセージ
 */
export async function deleteImage(
  url: string,
  bucket: string = 'images'
): Promise<{ success: boolean } | { error: string }> {
  try {
    // URLからパスを抽出
    const urlObj = new URL(url);
    const pathWithBucket = urlObj.pathname.split('/storage/v1/object/public/')[1];
    
    if (!pathWithBucket) {
      return { error: '無効な画像URLです' };
    }
    
    // バケット名を除いたパスを取得
    const path = pathWithBucket.substring(bucket.length + 1); // +1 for the slash
    
    // ファイルを削除
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return { error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return { error: '画像の削除に失敗しました' };
  }
}
