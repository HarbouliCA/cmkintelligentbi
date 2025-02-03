export async function getFacebookUserData(accessToken: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching Facebook user data:', error);
    throw error;
  }
}

export async function getFacebookPageData(accessToken: string, pageId: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=name,fan_count,followers_count&access_token=${accessToken}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching Facebook page data:', error);
    throw error;
  }
}
