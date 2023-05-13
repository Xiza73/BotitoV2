import fs from "fs";

export const readFile = (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (error, data) => {
      if (error) reject(error);
      resolve(data);
    });
  });
};

export const writeFile = (path: string, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, "utf8", (error) => {
      if (error) reject(error);
      resolve();
    });
  });
};

export const appendFile = (path: string, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.appendFile(path, data, "utf8", (error) => {
      if (error) reject(error);
      resolve();
    });
  });
};

export const deleteFile = (path: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (error) => {
      if (error) reject(error);
      resolve();
    });
  });
};
