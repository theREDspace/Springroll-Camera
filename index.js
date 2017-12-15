/**
 * @namespace springroll
 */

(function() {
  class SpringRollCamera {
    /**
     *
     * @param {string} SAVED_PHOTOS Image storage location
     * @param {number} STORAGE_LIMIT set storage limit
     * @param {object} options https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/#cameracameraoptions--object
     */
    constructor(
      SAVED_PHOTOS = "SAVED_PHOTOS",
      STORAGE_LIMIT = 10,
      options = {
        destinationType: 0,
        encodingType: 1,
        saveToPhotoAlbum: false
      }
    ) {
      this.SAVED_PHOTOS = SAVED_PHOTOS;
      this.STORAGE_LIMIT = STORAGE_LIMIT;
      this.options = options;
    }
    /**
     * Saves image to local storage. Will Delete oldest images if it exceeds storage limit
     * @param {string} image
     */
    savePhoto(image) {
      const savedImages =
        JSON.parse(localStorage.getItem(this.SAVED_PHOTOS)) || [];
      if (this.STORAGE_LIMIT <= savedImages.length) {
        savedImages.reverse().length = STORAGE_LIMIT + 1;
        savedImages.reverse();
      }

      savedImages.push(image);

      localStorage.setItem(this.SAVED_PHOTOS, JSON.stringify(savedImages));
    }

    /**
     * Opens up the mobile camera and returns a base64 image string if successful
     */
    openCamera() {
      return navigator.camera.getPicture(
        image => {
          this.savePhoto(image);

          return image;
        },
        err => {
          console.log(err);
          return undefined;
        },
        this.options
      );
    }

    /**
     * Takes a screenshot of the canvas and stores it in to local storage
     * @param {string} canvasId canvas element id
     */
    saveCanvas(canvasId = "stage") {
      const image = document.getElementById(canvasId).toDataURL();
      this.savePhoto(image);
      return image;
    }

    /**
     * Returns a base64 string of the image at index x
     * @param {number} x index of storage array
     * @returns {string} image as base64 string
     */
    loadPhoto(x) {
      return JSON.parse(localStorage.getItem(this.SAVED_PHOTOS))[x] || "";
    }

    /**
     * Returns a array of base64 strings for all images stored in local storage
     * @returns {array} returns all images stored in local storage
     */
    loadAllPhotos() {
      return JSON.parse(localStorage.getItem(this.SAVED_PHOTOS)) || [];
    }

    /**
     * Deletes photo at selected index.
     * @param {number} x
     * @returns {boolean} returns whether or not it was successful
     */
    deletePhoto(x) {
      const photoArray = JSON.parse(localStorage.getItem(this.SAVED_PHOTOS));
      const deletedPhoto = photoArray.splice(x, 1);

      if (1 <= deletedPhoto.length) {
        localStorage.setItem(this.SAVED_PHOTOS, JSON.stringify(photoArray));
        return true;
      }

      return false;
    }

    /**
     * Wipes all photos from local storage and replaces it with a empty array
     */
    deleteAllPhotos() {
      localStorage.setItem(this.SAVED_PHOTOS, JSON.stringify([]));
    }
  }

  namespace("springroll").ScreenShot = new SpringRollCamera();
})();
