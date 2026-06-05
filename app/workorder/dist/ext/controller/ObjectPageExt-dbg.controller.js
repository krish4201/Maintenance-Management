sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend(
        "maintenance.workorder.ext.controller.ObjectPageExt",
        {

            override: {

                onInit: async function () {

                    const role =
                        await this._getRole();

                    if(role !== "Supervisor"){

                        const btn =
                        this.byId(
                        "assignTechnician");

                        if(btn){
                           btn.setVisible(false);
                        }

                    }

                }

            },

            _getRole: async function () {

                const response =
                    await fetch(
                        "/odata/v4/role/getUserInfo()",
                        {
                            headers: {
                                "Accept": "application/json"
                            }
                        }
                    );

                if(!response.ok){
                    return "";
                }

                const userInfo =
                    await response.json();

                return userInfo.role || "";

            }

        });

});
