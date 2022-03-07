$(document).ready(function() {
  $("#sidebar-component").on("change", () => updateDesignerElement(update_sortable = true));
  $(".component_settings").on("change", updateDesignerElement);
  updateDesignerElement(true);
});

updateDesignerElement = function(update_sortable = false) {
  $(".component-container").html(null);
  var component = $("#sidebar-component").val();
  var component_html = designerElements[component]();
  var container = document.getElementById("sidebar-container");
  $(".component-container").html(component_html);

  if (component === "dropdown") {
    $(".component-container").find("select").selectize({
      labelField: "label",
      valueField: "value",
      searchField: ["label"]
    });
  }

  if (update_sortable) {
    Sortable.create(container, {
      group: {
        name: "shared",
        pull: "clone",
        put: false
      },
      onClone: function(evt) {
        var component = $("#sidebar-component").val();
        var sortable_settings = designerSortableSettings[component];
        if (sortable_settings) {
          Sortable.create(evt.item, sortable_settings);
        }
      },
      onEnd: function(evt) {
        var component = $("#sidebar-component").val();
        if (["dropdown", "input", "output"].includes(component)) {
          updateDesignerElement();
        }
      }
    });
  }
};

createRandomID = function(prefix) {
  return prefix + "_" + Math.random().toString(36).substr(2, 10);
};

var designerElements = {
  button: function() {
    var el = document.createElement("button");
    $(el).attr("data-shinyfunction", "actionButton");
    $(el).addClass("designer-element btn btn-default");

    var label = $("#sidebar-button-label").val();
    var button_class = $("#sidebar-button-class").val();
    var id = $("#sidebar-button-id").val();
    if (id === "") {
      id = createRandomID("button");
    }

    if (button_class === "default") {
      $(el).attr("data-shinyattributes", `inputId = "${id}"`);
    } else {
      $(el).attr("data-shinyattributes", `inputId = "${id}", class = "btn-${button_class}"`);
      $(el).addClass("btn-" + button_class);
    }

    $(el).html(label);
    return el;
  },

  input: function() {
    var el = document.createElement("div");
    var type = $("#sidebar-input-type").val();
    $(el).attr("data-shinyfunction", type + "Input");
    $(el).addClass("designer-element form-group shiny-input-container");


    var label = $("#sidebar-input-label").val();
    var id = $("#sidebar-input-id").val();
    if (id === "") {
      id = createRandomID("input");
    }

    var input_value = "";
    if (type === "numeric") {
      input_value = ", value = 1";
    }

    $(el).attr("data-shinyattributes", `inputId = "${id}", label = "${label}"${input_value}`);

    var el_label = document.createElement("label");
    $(el_label).addClass("control-label");
    $(el_label).html(label);

    var child_input_tag = "input";
    if (type === "textArea") {
      child_input_tag = "textarea";
    }
    var el_input = document.createElement(child_input_tag);
    $(el_input).addClass("form-control");
    if (type !== "textArea") {
      var input_types = {numeric: "number", text: "text", password: "password"};
      $(el_input).attr("type", input_types[type]);
    }
    $(el_input).attr("placeholder", type);

    $(el).html(el_label);
    $(el).append(el_input);
    return el;
  },

  dropdown: function() {
    var el = document.createElement("div");
    $(el).attr("data-shinyfunction", "selectInput");
    $(el).addClass("designer-element form-group shiny-input-container");


    var label = $("#sidebar-dropdown-label").val();
    var id = $("#sidebar-dropdown-id").val();
    if (id === "") {
      id = createRandomID("dropdown");
    }

    $(el).attr("data-shinyattributes", `inputId = "${id}", label = "${label}", choices = "..."`);

    var el_label = document.createElement("label");
    $(el_label).addClass("control-label");
    $(el_label).html(label);

    var el_dropdown = document.createElement("div");
    $(el_dropdown).html(document.createElement("select"));

    $(el).html(el_label);
    $(el).append(el_dropdown);
    return el;
  },

  output: function() {
    var el;
    var inline_text = "";
    var type = $("#sidebar-output-type").val();
    var type2 = type === "table" ? "datatable" : type;
    var inline = document.getElementById("sidebar-output-inline").checked;

    if (type === "verbatimText") {
      el = document.createElement("pre");
    } else if (inline) {
      el = document.createElement("span");
      inline_text = ", inline = TRUE";
    } else {
      el = document.createElement("div");
    }

    var id = $("#sidebar-output-id").val();
    if (id === "") {
      id = createRandomID(type);
    }

    var height_str, width_str = "";
    if (["plot", "image"].includes(type)) {
      validateCssUnit = function(x, fallback) {
        const regex = /^(auto|inherit|fit-content|calc\(.*\)|((\.\d+)|(\d+(\.\d+)?))(%|in|cm|mm|ch|em|ex|rem|pt|pc|px|vh|vw|vmin|vmax))$/;
        if (regex.test(x)) {
          return x;
        } else {
          return fallback;
        }
      };

      var width = validateCssUnit($("#sidebar-output-width").val(), "100%");
      var height = validateCssUnit($("#sidebar-output-height").val(), "400px");
      if (width !== "100%") {
        width_str = `, width = "${width}"`;
      }
      if (height !== "400px") {
        height_str = `, height = "${height}"`;
      }

      $(el).attr("style", `height: ${height}; width: ${width}`);
    }

    $(el).attr("data-shinyfunction", type + "Output");
    $(el).attr("data-shinyattributes", `outputId = "${id}"${inline_text}${height_str}${width_str}`);
    $(el).addClass(`designer-element output-element ${type}-output-element shiny-${type2}-output`);
    $(el).html(outputContents[type]);
    return el;
  },

  header: function() {
    var el = document.createElement($("#sidebar-header-tag").val());
    $(el).addClass("designer-element");
    $(el).attr("data-shinyfunction", $("#sidebar-header-tag").val());
    $(el).html($("#sidebar-header-value").val());
    return el;
  },

  row: function() {
    var el = document.createElement("div");
    $(el).addClass("designer-element row");
    $(el).attr("data-shinyfunction", "fluidRow");
    return el;
  },

  column: function() {
    var el = document.createElement("div");
    $(el).addClass("designer-element col-sm");

    var width = $("#sidebar-column-width").val();
    $(el).addClass("col-sm-" + width);

    var offset = $("#sidebar-column-offset").val();
    if (offset > 0) {
      $(el).addClass("offset-md-" + offset + " col-sm-offset-" + offset);
    }

    if (offset > 0) {
      $(el).attr("data-shinyattributes", "width = " + width + ", offset = " + offset);
    } else {
      $(el).attr("data-shinyattributes", "width = " + width);
    }

    $(el).attr("data-shinyfunction", "column");
    return el;
  },

  input_panel: function() {
    var el = document.createElement("div");
    $(el).addClass("designer-element shiny-input-panel shiny-flow-layout");
    $(el).attr("data-shinyfunction", "inputPanel");
    return el;
  }
};

var outputContents = {
  text: function() {
    return "Placeholder for Text Output";
  },
  verbatimText: function() {
    return "Placeholder for Verbatim Text Output";
  },
  plot: function() {
    var el = document.createElement("img");
    $(el).attr("src", "images/plot.png");
    $(el).attr("alt", "Placeholder for a plot output");
    $(el).attr("title", "Example Plot");
    return el;
  },
  table: function() {
    return "Example Table Output";
  },
  image: function() {
    var el = document.createElement("img");
    $(el).attr("src", "images/image.png");
    $(el).attr("alt", "Placeholder for an image output");
    $(el).attr("title", "Example Image");
    return el;
  },
  html: function() {
    return "Placeholder for HTML Output";
  }
};

var designerSortableSettings = {
  row: {
    group: {
      name: "shared",
      put: function (to, from, clone) {
        return clone.classList.contains("col-sm");
      }
    }
  },
  column: {
    group: {
      name: "shared",
      put: function (to, from, clone) {
        return !clone.classList.contains("col-sm");
      }
    }
  },
  input_panel: {
    group: {
      name: "shared",
      put: function (to, from, clone) {
        return clone.classList.contains("form-group") || clone.classList.contains("btn");
      }
    }
  }
};