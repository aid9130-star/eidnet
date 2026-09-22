export async function safeFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      throw new Error('تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت');
    }
    throw err;
  }

  const text = await res.text();
  let data: any = {};
  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }
  }

  if (!res.ok) {
    if (res.status === 405 || res.status === 404) {
      throw new Error(`مسار الخادم (${url}) غير متاح حالياً (${res.status}). يرجى التحقق من إعدادات Vercel.`);
    }
    throw new Error(data?.error || `خطأ في استجابة الخادم (${res.status})`);
  }

  return data as T;
}
