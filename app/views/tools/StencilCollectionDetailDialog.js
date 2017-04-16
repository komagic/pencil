function StencilCollectionDetailDialog(acceptActionLabel) {
    Dialog.call(this);
    this.title = "Stencil Collection Details";
    this.acceptActionLabel = acceptActionLabel;

    this.bind("click", this.handleSetBrowseEvent, this.setContainer);
}
__extend(Dialog, StencilCollectionDetailDialog);

StencilCollectionDetailDialog.prototype.handleSetBrowseEvent = function (event) {
    var targetInputName = event.target ? event.target.getAttribute("target") : null;
    if (!targetInputName) return;

    var input = this[targetInputName];
    var nameInput = this[targetInputName.replace(/PathInput/, "NameInput")];

    var defaultPath = Pencil.controller.documentPath ? path.dirname(Pencil.controller.documentPath) : os.homedir();
    dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: "Select Resource Directory",
        defaultPath: defaultPath,
        properties: ["openDirectory"]
    }, function (filenames) {
        if (!filenames || filenames.length <= 0) return;
        var selectedPath = filenames[0];
        if (Pencil.controller.documentPath) {
            var base = path.dirname(Pencil.controller.documentPath);
            var relative = path.relative(base, selectedPath);
            const LIMIT = ".." + path.sep + ".." + path.sep + ".."; // 3 levels up means bad
            if (!relative.startsWith(LIMIT)) selectedPath = relative;
        }

        input.value = selectedPath;
        if (!nameInput.value) {
            nameInput.value = path.basename(filenames[0]);
        }
    });

};
StencilCollectionDetailDialog.prototype.setup = function (options) {
    options = options || {};
    this.doc = options.doc || Pencil.controller.doc;

    var defaultDocName = Pencil.controller.getDocumentName().replace(/\*/g, "").trim();
    var systemUsername = os.userInfo().username;

    this.displayNameInput.value = options.displayName || defaultDocName;
    this.idInput.value = options.id || (systemUsername + "." + defaultDocName.replace(/[^a-z0-9]+/gi, ""));
    this.descriptionInput.value = options.description || "";
    this.authorNameInput.value = options.author || systemUsername;
    this.urlInput.value = options.url || "";

    this.scriptInput.value = options.extraScript || "";

    this.embedReferencedFontsCheckbox.checked = typeof(options.embedReferencedFonts) != "boolean" ? true : options.embedReferencedFonts;

    var resourceSets = options.resourceSets || [];

    var index = 0;
    for (var set of resourceSets) {
        if (index > 4) break;
        if (set && set.name && set.path) {
            this["resourceSet" + index + "NameInput"].value = set.name.trim();
            this["resourceSet" + index + "PathInput"].value = set.path;

            index ++;
        }
    }
};
StencilCollectionDetailDialog.prototype.save = function () {
    var options = {};

    try {

        options.displayName = getRequiredValue(this.displayNameInput, "Please enter collection's name.");
        options.id = getRequiredValue(this.idInput, "Please enter collection's id.");
        options.description = this.descriptionInput.value;
        options.author = getRequiredValue(this.authorNameInput, "Please enter author's name.");
        options.url = getRequiredValue(this.urlInput, "Please enter a valid URL.", /^(http(s?):\/\/.+)?$/);

        options.extraScript = this.scriptInput.value;
        options.embedReferencedFonts = this.embedReferencedFontsCheckbox.checked;

        options.resourceSets = [];
        for (var i = 0; i < 5; i ++) {
            var setName = this["resourceSet" + i + "NameInput"].value;
            var setPath = this["resourceSet" + i + "PathInput"].value;
            if (setName && setPath) {
                options.resourceSets.push({
                    name: setName.trim(),
                    path: setPath
                });
            }
        };

        this.close(options);
    } catch (e) {
        handleCommonValidationError(e);
        return false;
    }
};

StencilCollectionDetailDialog.prototype.getDialogActions = function () {
    return [
        { type: "accept", title: this.acceptActionLabel || "Save", run: function () { return this.save(); } },
        Dialog.ACTION_CANCEL
    ];
};
