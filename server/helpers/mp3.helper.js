const privateMp3URL = 'https://s3-us-west-2.amazonaws.com/sd-profile-pictures/adfree/';

function getAdFreeMp3(originalMp3) {
  if (typeof originalMp3 !== 'string') return originalMp3;

  const extractedFile = originalMp3.toString().match(/\/traffic.libsyn.co.+\/sedaily\/(.*?).mp3/);

  let privateMp3 = originalMp3;

  if (extractedFile && extractedFile.length && extractedFile[1]) {
    privateMp3 = `${privateMp3URL}${extractedFile[1]}_adfree.mp3`;
  }

  return privateMp3;
}

export default { getAdFreeMp3 };
