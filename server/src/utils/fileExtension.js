import path from "path";
const getFileExtension = (fileName) => {
    if (!fileName || typeof fileName !== "string"){
        return null;
    }

    const extension = path.extname(fileName).toLocaleLowerCase();

    return extension || null;
};

export default {
    getFileExtension,
};