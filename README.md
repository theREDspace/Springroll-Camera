# Springroll Camera

## Installation

```
cordova plugin add https://github.com/theREDspace/Springroll-Camera.git
```

After installation it is accessed by the global variable of _springrollCamera_

## Properties

You can adjust these properties to fit your needs.

### err

```
Callback function for all plugin errors.

By default this is null.
```

### STORAGE_LIMIT

```
The storage limit of photos to keep before over writing the oldest.

By default the limit is 10.
```

## Methods

### savePhoto(base64String, callback)

```
  Saves a base64 Image to the device's file system.

  The callback receives the file system path on success.
```

### openCamera(callback)

```
  Opens the device's camera and saves the photo to device storage.

  The callback receives the file system path on success.
```

### saveCanvas(canvasID, callback)

```
  Takes a snapshot of the specified canvas html element based on element id.

  The callback receives the file system path on success.
```

### getPhoto(index, callback)

```
  Callback receives the file path at the specified index.
```

### getAllPhotos(callback)

```
  Callback receives an array of all files in storage
```

### delete(index)

```
Deletes file at specified index
```
