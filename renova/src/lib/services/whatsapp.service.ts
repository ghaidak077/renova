export function generateWhatsAppLink(
  phoneNumber: string,
  listingTitle: string,
  listingUrl?: string
): string {
  // Strip non-numeric characters for link
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  let message = `مرحباً، أريد الاستفسار عن الإعلان: ${listingTitle}`;
  if (listingUrl) {
    message += `\n${listingUrl}`;
  }

  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}
