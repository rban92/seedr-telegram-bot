const axios = require("axios").default;
const FormData = require("form-data");

const BASE_URL = "https://www.seedr.cc";

const headers = {
  cookie: `RSESS_remember=${process.env.SESSION_TOKEN}`,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36 Edg/103.0.1264.62",
  Host: "www.seedr.cc",
  Connection: "keep-alive",
};


const addMagnet = async (magnet) => {
  const form = new FormData();
  form.append("folder_id", 0);
  form.append("type", "torrent");
  form.append("torrent_magnet", magnet);
  const response = await axios.post(BASE_URL + "/task", form, {
    headers: { ...form.getHeaders(), ...headers },
  });
  return response.data;
};


//get list of all torrents/folders
const getFolders = async () => {
  const response = await axios.get(BASE_URL + "/fs/folder/0/items", {
    headers: headers,
  });
  return response.data;

};


const clearWishlist = async () => {
  const res = await axios.get(`${BASE_URL}/account/settings`, {headers: headers});
  const wishlist = res.data.account.wishlist;
  for (const item of wishlist){
    await axios.delete(`${BASE_URL}/wishlist/${item.id}`, {headers: headers});
  }
}

const deleteFolders = async () => {
  const data = await getFolders();
  const form = new FormData();
  body = [];
  data.folders.forEach((folder) => {
    body.push({ type: "folder", id: folder.id.toString() });
  });
  data.torrents.forEach((torrent) => {
    body.push({ type: "torrent", id: torrent.id.toString() });
  });
  form.append("delete_arr", JSON.stringify(body));
   await axios.post(BASE_URL + `/fs/batch/delete`, form, {
    headers: { ...form.getHeaders(), ...headers },
  });
  await clearWishlist();
};




const generateFolderArchive = async (folderId) => {
  url = BASE_URL + "/download/archive";
  const form = new FormData();
  form.append("archive_arr[0][type]", "folder");
  form.append("archive_arr[0][id]", folderId);
  const response = await axios.post(url, form, {
    headers: { ...headers, ...form.getHeaders() },
  });
  return response.data;
};

const getFilesbyFolderId = async (folderId) => {
  const url = BASE_URL + `/fs/folder/${folderId}/items`;
  const response = await axios.get(url, { headers: headers });
  if ((response.status = 200)) {
    const files = [];
    for await (const file of response.data.files) {
      const generatedUrl = await axios.get(
        BASE_URL + `/download/file/${file.id}/url`,
        { headers: headers }
      );
      files.push({
        name: file.name,
        size: file.size,
        url: generatedUrl.data.url,
      });
    }  

    return files;
  }
};

const getFileByFileId = async (fileId) => {
  const url = `${BASE_URL}/download/file/${fileId}/url`;
  const response = await axios.get(url, { headers: headers });
  return response.data;
};

module.exports = {
  addMagnet,
  getFolders,
  deleteFolders,
  generateFolderArchive,
  getFilesbyFolderId,
  getFileByFileId
};
