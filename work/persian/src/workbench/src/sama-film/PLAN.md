# معرفی مدارس سما — Implementation Plan

**Goal:** ساخت پیش‌نمایش عمودی ۱۳٫۵ ثانیه‌ای در Remotion، ثبت composition و تحویل MP4، montage و گزارش.

**Architecture:** یک composition مستقل در `src/sama-film/` با انیمیشن زمان‌محور و قابل seek، فونت محلی kit فارسی، موسیقی و SFX موجود. ثبت در ورودی Remotion فعلی؛ خروجی نهایی در مسیرهای تعیین‌شده.

**Tech Stack:** React, Remotion, ابزارهای موجود ورک‌بنچ و ffmpeg.

**Constraints:** 1080×1920، 30fps، 405 فریم؛ متن دقیق مصوب؛ بدون ادعا، تزیین فرهنگی/مذهبی، وابستگی خارجی یا fallback فونت.

## Steps
- [ ] خواندن راهنماهای فارسی، موشن، صدا، skill و ورودی `_fa`؛ بازبینی checkout فعلی.
- [ ] ساخت composition یکپارچه و ثبت `SamaSchoolsPreview`.
- [ ] اجرای lint-film، رندر مطلق، استخراج شش‌فریمی montage و ۹ still.
- [ ] بررسی خروجی/صدا، نوشتن گزارش و ثبت هر مرحله در progress.
