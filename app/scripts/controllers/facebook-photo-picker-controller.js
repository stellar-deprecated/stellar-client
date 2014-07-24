'use strict';

var sc = angular.module('stellarClient');

sc.controller('FacebookPhotoPickerCtrl', function ($scope, $http, session) {

    var selector, logActivity, callbackAlbumSelected, callbackPhotoUnselected, callbackSubmit;
    var buttonOK = $('#CSPhotoSelector_buttonOK');
    var o = this;

    /* --------------------------------------------------------------------
     * Photo selector functions
     * ----------------------------------------------------------------- */

    $scope.fbphotoSelect = function(id) {
        // if no user/friend id is sent, default to current user
        if (!id) id = 'me';

        var callbackAlbumSelected = function(albumId) {
            var album, name;
            album = CSPhotoSelector.getAlbumById(albumId);
            // show album photos
            selector.showPhotoSelector(null, album.id);
        };

        var callbackAlbumUnselected = function(albumId) {
            var album, name;
            album = CSPhotoSelector.getAlbumById(albumId);
        };

        var callbackPhotoSelected = function(photoId) {
            var photo;
            photo = CSPhotoSelector.getPhotoById(photoId);
            buttonOK.show();
        };

        var callbackPhotoUnselected = function(photoId) {
            var photo;
            album = CSPhotoSelector.getPhotoById(photoId);
            buttonOK.hide();
        };

        var callbackSubmit = function(photoId) {
            var photo;
            photo = CSPhotoSelector.getPhotoById(photoId);
            $scope.$emit('profilePicturePicked', {link: photo.picture});
        };


        // Initialise the Photo Selector with options that will apply to all instances
        CSPhotoSelector.init({debug: true});

        // Create Photo Selector instances
        selector = CSPhotoSelector.newInstance({
            callbackAlbumSelected   : callbackAlbumSelected,
            callbackAlbumUnselected : callbackAlbumUnselected,
            callbackPhotoSelected   : callbackPhotoSelected,
            callbackPhotoUnselected : callbackPhotoUnselected,
            callbackSubmit          : callbackSubmit,
            maxSelection            : 1,
            albumsPerPage           : 6,
            photosPerPage           : 200,
            autoDeselection         : true
        });

        // reset and show album selector
        selector.reset();
        selector.showAlbumSelector(id);
    }


    $scope.pickPhoto = function () {
        var id = null;
        if ( $(this).attr('data-id') ) id = $(this).attr('data-id');
        $scope.fbphotoSelect(id);
    }
});