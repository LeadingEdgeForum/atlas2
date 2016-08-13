/*jshint esversion: 6 */

import Dispatcher from '../../dispatcher';
import Constants from '../../constants';

var MapListActions = {

    mapListRetrieved: function(mapArray) {
      // MapDispatcher.dispatch({
      //   actionType: MapConstants.LOAD_MAPS,
      //   maps: mapArray
      // });
    },

    toggleCreateNewMapDialogState : function(enable){
      // MapDispatcher.dispatch({
      //   actionType: MapConstants.SHOW_CREATE_NEW_MAP_DIALOG,
      //   enable: enable
      // });
    }
};

module.exports = MapListActions;
