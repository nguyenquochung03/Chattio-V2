export function getFirstLetterOfLastName(fullName) {
  const nameParts = fullName.split(" ");
  const lastName = nameParts[nameParts.length - 1];
  return lastName.charAt(0).toUpperCase();
}

export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function splitStringByDash(inputString) {
  if (typeof inputString !== "string") {
    return { success: false, data: null };
  }

  if (!inputString.includes("-")) {
    return { success: false, data: null };
  }

  const data = inputString.split("-");
  return { success: true, data };
}

export function extractAndFormat(input) {
  const firstDashIndex = input.indexOf("-");

  if (firstDashIndex === -1) {
    return {
      success: false,
    };
  }

  const secretPart = input.substring(0, firstDashIndex);
  const remainingPart = input.substring(firstDashIndex + 1);

  return {
    success: true,
    secret: secretPart,
    remaining: remainingPart,
  };
}
