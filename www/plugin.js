class SpringRollCamera {
  /**
   * @constructor
   * @param {*} FS Devices local storage
   * @param {number} STORAGE_LIMIT set storage limit
   * @param {object} options https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/#cameracameraoptions--object
   */
  constructor(
    errCallback = null,
    STORAGE_LIMIT = 10,
    FS = null,
    options = {
      destinationType: 0,
      saveToPhotoAlbum: false
    }
  ) {
    this.FILE = {
      READ: 0,
      WRITE: 1,
      DELETE: 2
    };
    this.FILE_INDEX = "PHOTO_LAST_SAVED_INDEX";
    this.err = errCallback;
    this.FS = FS;
    this.STORAGE_LIMIT = STORAGE_LIMIT;
    this.options = options;

    this.lastSavedIndex = localStorage.getItem(this.FILE_INDEX);

    if (null === this.lastSavedIndex) {
      this.lastSavedIndex = 0;
    }
  }


  /**
   * @private
   * Writes data to the local file system
   * @param {*} fileEntry pointer to file object
   * @param {*} dataBlob data blob to be written to file
   */
  _writeFile(fileEntry, dataBlob, callback) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(fileWriter => {
      fileWriter.onwriteend = () => {
        this.lastSavedIndex++;
        localStorage.setItem(this.FILE_INDEX, this.lastSavedIndex);
        callback(fileEntry.toURL());
      };
      fileWriter.onerror = this._err;

      fileWriter.write(dataBlob);
    });
  }

  /**
   * Converts a base64 string to blob
   * @private
   * @param {*} b64Data base 64 string to be converted to blob
   * @param {*} contentType content type of blob, default is image/png
   * @param {*} sliceSize how large the slices of the array should be
   * @returns {Blob} Blob of base64 string
   */
  _toBlob(b64Data, contentType = "image/png", sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (
      let offset = 0, bLength = byteCharacters.length;
      offset < bLength;
      offset += sliceSize
    ) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0, sLength = slice.length; i < sLength; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });

    return blob;
  }

  /**
   * @private
   * calls the correct function for the file depending if you need to read or write
   * @param {number} fileIndex what file by index to wish to work with
   * @param {boolean} write write to file or not
   * @param {*} data data to be written if write is set to true
   */
  _file(fileIndex, callback, action = this.FILE.READ, data = "") {
    const create = action !== this.FILE.DELETE ? true : false;

    this.FS.root.getFile(
      `image${fileIndex}.png`,
      { create: create, exclusive: false },
      fileEntry => {
        switch (action) {
          case this.FILE.WRITE: // write to file
            this._writeFile(fileEntry, this._toBlob(data), callback);
            break;
          case this.FILE.DELETE: // delete file
            fileEntry.remove(callback, this._err);

          default:
            callback(fileEntry.toURL());
            break;
        }
      }
    );
  }

  /**
   * @private
   * Generic error logging function
   * @param {*} err The error
   */
  _err(err) {
    console.log(`SpringRoll Camera Error: ${err}`);
    console.log(err);
    this.err(err);
  }

  /**
   * Saves image to local storage. Will Delete oldest images if it exceeds storage limit
   * @param {string} image
   */
  savePhoto(imageBlob, callback) {
    if (this.lastSavedIndex >= this.STORAGE_LIMIT) {
      this.lastSavedIndex = 0;
    }

    this._file(this.lastSavedIndex, callback, this.FILE.WRITE, imageBlob);
  }

  /**
   * Opens the device camera and saves it to local storage
   * @param {function} callback function to be called when saving the photo to storage is complete
   */
  openCamera(callback) {
    navigator.camera.getPicture(
      image => {
        this.savePhoto(image, callback);
      },
      this._err,
      this.options
    );
  }

  /**
   * Takes a screenshot of the canvas and puts it in to device storage
   * @param {string} canvasId canvas element id
   */
  saveCanvas(canvasId = "stage", callback) {
    const image = document.getElementById(canvasId).toDataURL();
    this.savePhoto(image, callback);
  }

  /**
   * Returns a url to the desired image
   * @param {number} index index of storage array
   * @returns {string} image as file path string
   */
  getPhoto(index, callback) {
    this._file(index, callback);
  }

  /**
   * Returns a array of file paths strings for all images stored in local storage
   * @returns {array} returns all images stored in local storage
   */
  getAllPhotos(callback) {
    window.resolveLocalFileSystemURL(
      this.FS.root.nativeURL,
      fileSystem => {
        let reader = fileSystem.createReader();
        reader.readEntries(entries => {
          const outputArray = [];
          for (let i = 0, eLength = entries.length; i < eLength; i++) {
            outputArray.push(entries[i].toURL());
          }
          callback(outputArray);
        }, this._err);
      },
      this._err
    );
  }

  /**
   * Deletes file at target index
   * @param {*} index index of file to be deleted
   */
  delete(index) {
    this._file(
      index,
      () => {
        console.log("File was deleted");
      },
      this._FILE.DELETE
    );
  }
}

const srCamera = new SpringRollCamera();

(function srCameraRun() {
  // Wait until cordova is ready before constructing the object
  document.addEventListener("deviceready", springrollOnDeviceReady, false);

  function springrollOnDeviceReady() {
    window.requestFileSystem(
      LocalFileSystem.PERSISTENT,
      0,
      fileStorage => {
        srCamera.FS = fileStorage;
      },
      err => {
        console.log(`Error getting permissions to file system: \n ${err}`);
      }
    );
  }
})();

module.exports = srCamera;
