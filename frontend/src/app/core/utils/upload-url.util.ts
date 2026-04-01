
export function getDisplayUploadUrl(uploadUrl: string | undefined): string {
  if (!uploadUrl?.trim()) return '';
  return uploadUrl.replace(/localhost:8020/, 'localhost:8080');
}
