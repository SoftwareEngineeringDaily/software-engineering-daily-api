
function replaceWithAdFree(post) {
  try {
    const originalMP3Split = post.mp3.split('/');
    if( originalMP3Split.length > 0 ) {
      const fileName =  originalMP3Split[originalMP3Split.length -1];
      const newFileName = fileName.replace('.mp3', '_adfree.mp3');
      post.mp3 = config.adFreeURL + newFileName;
    }
  } catch(e) {}
  return post;
}

export { replaceWithAdFree }
