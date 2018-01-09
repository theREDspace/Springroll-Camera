/**
 * @namespace springroll
 */
(function() {
  class SpringRollCamera {
    /**
     * @constructor
     * @param {*} FS Devices local storage
     * @param {number} STORAGE_LIMIT set storage limit
     * @param {object} options https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/#cameracameraoptions--object
     */
    constructor(
      FS,
      STORAGE_LIMIT = 10,
      options = {
        destinationType: 0,
        encodingType: 1,
        saveToPhotoAlbum: false
      }
    ) {
      this.FILE_INDEX = "PHOTO_LAST_SAVED_INDEX";
      this.FS = FS;
      this.STORAGE_LIMIT = STORAGE_LIMIT;
      this.options = options;

      this.lastSavedIndex = localStorage.getItem(this.FILE_INDEX);

      if (null == this.lastSavedIndex) {
        this.lastSavedIndex = 0;
      }
    }

    delete(index) {
      this._file(
        index,
        () => {
          console.log("File was deleted");
        },
        2
      );
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

    _toBlob(b64Data, contentType = "", sliceSize = 512) {
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
    _file(fileIndex, callback, action = 0, data = "") {
      const create = action === 1 ? true : false;

      this.FS.root.getFile(
        `image${fileIndex}.png`,
        { create: create, exclusive: false },
        fileEntry => {
          switch (action) {
            case 1: // write to file
              callback(
                this._writeFile(fileEntry, this._toBlob(data), callback)
              );
              break;
            case 2: // delete file
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
    }

    /**
     * Saves image to local storage. Will Delete oldest images if it exceeds storage limit
     * @param {string} image
     */
    savePhoto(imageBlob, callback) {
      if (this.lastSavedIndex >= this.STORAGE_LIMIT) {
        this.lastSavedIndex = 0;
      }

      this._file(this.lastSavedIndex, callback, 1, imageBlob);
    }

    /**
     * Opens up the mobile camera and returns a base64 image string if successful
     */
    openCamera(callback) {
      return navigator.camera.getPicture(
        image => {
          this.savePhoto(image, callback);
        },
        this._err,
        this.options
      );
    }

    /**
     * Takes a screenshot of the canvas and stores it in to local storage
     * @param {string} canvasId canvas element id
     */
    saveCanvas(canvasId = "stage", callback) {
      const image = document.getElementById(canvasId).toDataURL();
      this.savePhoto(image, callback);
      return image;
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
    getAllPhotos(callback, path = "files") {
      window.resolveLocalFileSystemURL(
        cordova.file.dataDirectory + path,
        fileSystem => {
          let reader = fileSystem.createReader();
          reader.readEntries(entries => {
            const outputArray = [];
            for (let i = 0, eLength = entries.length; i < eLength; i++) {
              outputArray.push(entries[i].toURL());
            }
            callback(outputArray);
          }, this.err);
        },
        this._err
      );
    }
  }

  // Wait until cordova is ready before constructing the object
  document.addEventListener("deviceready", onDeviceReady, false);

  function onDeviceReady() {
    namespace("springroll").ScreenShot = new SpringRollCamera();
  }
})();
