/**
 * Wrapper function for single-page app.
 */
const startApp = () => {
    /**
     * Defininition for binary tree node.
     */
    class TreeNode {
        constructor(val, left, right) {
            this.val = val === undefined ? 0 : val;
            this.left = left === undefined ? null : left;
            this.right = right === undefined ? null : right;
        }

        static traverse(root, path) {
            let node = root;
            while (path.length > 0) {
                if (path[0] === "l") {
                    node = node.left;
                } else if (path[0] === "r") {
                    node = node.right;
                } else {
                    throw new Error(
                        `Traversal path string can only contain 'l' or 'r'.`
                    );
                }
                path = path.slice(1);
            }
            return node;
        }

        static traverseToParent(root, path) {
            return TreeNode.traverse(root, path.slice(0, path.length - 1));
        }

        static maxDepth(root) {
            if (root === null) return 0;
            return (
                Math.max(this.maxDepth(root.left), this.maxDepth(root.right)) +
                1
            );
        }

        delete(path) {
            let root = this;
            const parent = TreeNode.traverseToParent(root, path);
            const next = path[path.length - 1];
            if (next === "l") {
                parent.left = null;
            } else if (next === "r") {
                parent.right = null;
            } else {
                throw new Error(
                    `Traversal path string can only contain 'l' or 'r'.`
                );
            }
        }

        insert(path, value = 0) {
            let root = this;
            const parent = TreeNode.traverseToParent(root, path);
            const next = path[path.length - 1];
            if (next === "l") {
                parent.left = new TreeNode(value);
            } else if (next === "r") {
                parent.right = new TreeNode(value);
            } else {
                throw new Error(
                    `Traversal path string can only contain 'l' or 'r'.`
                );
            }
        }
    }

    /**
     * This function transforms the user input into a binary tree.
     * There is basic invalid input error handing. Inputs which cannot
     * be JSON-parsed will cause the error message to be displayed.
     * @param {String} arrString - The user input array.
     * @returns {TreeNode} - The root of the binary tree.
     */
    const buildTreeFromArrString = (arrString) => {
        $alertContainer.classList.remove("active");

        /* replace single with double quotes, remove whitespaces */
        arrString = arrString.replace(/'/g, '"').replace(/\s/g, "");
        /* remove extra brackets and re-add at ends */
        arrString = "[" + arrString.replace(/[\[\]]+/g, "") + "]";
        $treeArrayInput.innerText = arrString;

        if (arrString === "[]") return null;

        try {
            arr = JSON.parse(arrString);
        } catch (e) {
            console.log(e);
            $alertContainer.classList.add("active");
            $alertContainer.innerHTML = `<span id="error-message">${e}</span>`;
            return binaryTreeRoot; // no changes made
        }

        /* BFS algorithm to create Tree Object*/
        const root = new TreeNode(arr.shift());
        const queue = [root];
        while (queue.length > 0 && arr.length > 0) {
            const currNode = queue.shift();
            const leftVal = arr.shift();
            const rightVal = arr.shift();

            if (leftVal !== null && leftVal !== undefined) {
                currNode.left = new TreeNode(leftVal);
                queue.push(currNode.left);
            }
            if (rightVal !== null && rightVal !== undefined) {
                currNode.right = new TreeNode(rightVal);
                queue.push(currNode.right);
            }
        }
        return root;
    };

    /**
     * This function is called when the user modifies the binary tree
     * with clicks in the diagram. The input field is updated to
     * reflect the currently displayed tree.
     * @param {TreeNode} root - The binary tree root.
     * @returns
     */
    const updateTreeArray = (root) => {
        $alertContainer.classList.remove("active");
        if (root === null) {
            document.getElementById("tree-array-input").innerText = "[]";
            return;
        }

        const arr = [root.val];

        // BFS algorithm to create array from tree
        const queue = [root];
        while (queue.length > 0) {
            const node = queue.shift();
            if (node.left) {
                arr.push(node.left.val);
                queue.push(node.left);
            } else {
                arr.push(null);
            }
            if (node.right) {
                arr.push(node.right.val);
                queue.push(node.right);
            } else {
                arr.push(null);
            }
        }

        /* trim nulls off the end of the array */
        while (arr[arr.length - 1] === null) arr.pop();

        /* update input field, trigger animation */
        const textBefore = $treeArrayInput.innerText;
        const textAfter = JSON.stringify(arr);
        if (textBefore !== textAfter) {
            $treeArrayInput.innerText = textAfter;
            $treeArrayInput.classList.toggle("pulse");
            setTimeout(() => {
                $treeArrayInput.classList.toggle("pulse");
            }, 500);
        }
    };

    /**
     * This function draws the SVG elements to create the binary tree graphic.
     * @param {TreeNode} root
     * @returns
     */
    const renderTreeGraphic = (root) => {
        /* Clear contents of display before re-drawing */
        const displaySVG = d3.select("#svg-display");
        displaySVG.selectAll("*").remove();
        displaySVG.append("g").attr("id", "svg-tree");
        const treeSVG = d3.select("#svg-tree");

        const treeDepth = TreeNode.maxDepth(root);
        const displayCenter =
            displaySVG.node().getBoundingClientRect().width / 2;

        /* Empty tree, so display a message */
        if (root === null) {
            updateTreeArray(binaryTreeRoot);
            drawEmptyTree(treeSVG, displayCenter, dy);
            return;
        }

        /**
         * Calculate the horizontal offset (dx) of child nodes at each depth of the tree.
         * The value of dx is dependent on:
         * 1) The depth of the node, (i + 1)
         * 2) The minimum distance between sibling nodes, MIN_HORIZ_DIST
         * 3) The maximum allowable depth of the tree, maxTreeDepth
         */
        const dxAtDepth = new Array(treeDepth).fill().map((_, i) => {
            let dx =
                minNodeSpacing *
                (Math.pow(2, treeDepth - 1) / Math.pow(2, i + 1));
            console.log({ treeDepth, maxTreeDepth });
            if (treeDepth >= maxTreeDepth) dx /= 2;
            return dx;
        });

        /* BFS traverse through tree and draw SVG elements */
        const queue = [[root, 1, displayCenter, 75, ""]]; // [node, depth, x-position, y-position, pathID]
        while (queue.length > 0) {
            const [node, depth, x, y, pathID] = queue.shift();
            const dx = dxAtDepth[depth - 1]; // horizontal offset of child nodes.

            /**
             * If there is a child node, add it to the queue.
             * If there is no child node, draw an area below
             * which can be clicked to add a new node.
             */
            if (node.left) {
                drawNodeBranchSVG(treeSVG, x, y, x - dx, y + dy);
                queue.push([
                    node.left,
                    depth + 1,
                    x - dx,
                    y + dy,
                    pathID + "l",
                ]);
            } else if (pathID.length + 1 < maxTreeDepth) {
                drawNewNodeAreaSVG(treeSVG, x, y, x - dx, y + dy, pathID + "l");
            }
            if (node.right) {
                drawNodeBranchSVG(treeSVG, x, y, x + dx, y + dy);
                queue.push([
                    node.right,
                    depth + 1,
                    x + dx,
                    y + dy,
                    pathID + "r",
                ]);
            } else if (pathID.length + 1 < maxTreeDepth) {
                drawNewNodeAreaSVG(treeSVG, x, y, x + dx, y + dy, pathID + "r");
            }

            /* Leaf nodes will be colored differently */
            let nodeClasses =
                "node" + (!node.left && !node.right ? " leaf" : "");

            /* Draw the node and its value */
            drawNodeCircleSVG(treeSVG, x, y, nodeClasses, pathID);
            drawNodeValueSVG(treeSVG, x, y, node.val);
        }

        /* Center and scale the tree */
        transformTreeSVG(treeSVG, displaySVG);

        /* User can click the new node area to insert a node in the tree */
        d3.selectAll(".new-node-area").on("click", (e) => {
            const path = e.target.id;
            binaryTreeRoot.insert(path, valueGenerator());
            updateTreeArray(binaryTreeRoot);
            renderTreeGraphic(binaryTreeRoot);
        });

        /* User can click the node to edit its value, or right-click to delete */
        d3.selectAll(".node").on("mouseup", (e) => {
            if (e.which === 1) {
                drawEditNodeValueField(e.target);
            } else if (e.which === 3) {
                const path = e.target.id;
                if (path === "") {
                    // deleting root node
                    binaryTreeRoot = null;
                } else {
                    binaryTreeRoot.delete(path);
                }
                updateTreeArray(binaryTreeRoot);
                renderTreeGraphic(binaryTreeRoot);
            }
        });
    };

    /**
     * Draw the empty tree message.
     * @param {SVGElement} svg - The SVG <g> element which we will draw inside.
     * @param {Number} x - X position of message.
     * @param {Number} y - Y position of message.
     */
    const drawEmptyTree = (svg, x, y) => {
        const group = svg.append("g").attr("class", "empty-tree-message-group");
        group
            .append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle") // horizontally center text
            .attr("dy", "7") // y offset text
            .text("(empty tree)");
        group
            .append("text")
            .attr("class", "empty-tree-message")
            .attr("x", x)
            .attr("y", y + 25)
            .attr("text-anchor", "middle") // horizontally center text
            .attr("dy", "7") // y offset text
            .text("click to add root node");
        group.on("click", () => {
            /* The value will be random or fixed, depending on the option selected */
            binaryTreeRoot = new TreeNode(valueGenerator());
            updateTreeArray(binaryTreeRoot);
            renderTreeGraphic(binaryTreeRoot);
        });
    };

    /**
     * Draw the node circle.
     * @param {SVGElement} svg - The SVG <g> element which we will draw inside.
     * @param {Number} x - The X center of the circle.
     * @param {Number} y - The Y center of the circle.
     * @param {String} nodeClasses - The classes to add to the
     * @param {*} pathID  -
     */
    const drawNodeCircleSVG = (svg, x, y, nodeClasses, pathID) => {
        if ($optionColoredLeafs.checked) nodeClasses += " colored";
        svg.append("circle")
            .attr("class", nodeClasses)
            .attr("id", pathID)
            .attr("r", 20) // fixed 20px radius
            .attr("cx", x)
            .attr("cy", y);
    };

    /**
     * Draw the node value.
     * @param {SVGElement} svg - The SVG <g> element which we will draw inside.
     * @param {Number} x - The X center of the text.
     * @param {Number} y - The y center of the text.
     * @param {*} val - The value of the node to draw.
     */
    const drawNodeValueSVG = (svg, x, y, val) => {
        svg.append("text")
            .attr("class", "node-val")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle") // horizontally center text in node
            .attr("dy", "7") // y offset text so it appears in center of node
            .text(val);
    };

    /**
     * Draw the branch between nodes.
     * @param {SVGElement} svg - The SVG <g> element which we will draw inside.
     * @param {Number} x1 - The X start of the branch.
     * @param {Number} y1 - The Y start of the branch.
     * @param {Number} x2 - The X end of the branch.
     * @param {Number} y2 - The Y end of the branch.
     */
    const drawNodeBranchSVG = (svg, x1, y1, x2, y2) => {
        svg.append("line")
            .attr("class", "branch")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);
    };

    /**
     * Draw the new node area, which is bounded by another <g> element.
     * @param {SVGElement} svg
     * @param {Number} x1
     * @param {Number} y1
     * @param {Number} x2
     * @param {Number} y2
     * @param {String} id
     */
    const drawNewNodeAreaSVG = (svg, x1, y1, x2, y2, id) => {
        const group = svg.append("g").attr(
            "class",
            $optionShowAddNode.checked // user option
                ? "new-node-area visible"
                : "new-node-area"
        );

        let x = Math.min(x1, x2);
        if (x1 > x2) x -= 20;
        let width = Math.abs(x1 - x2) + 20;

        /* Draw a rectangle which will be transparent,
		but when clicked inside will trigger the event handlers */
        group
            .append("rect")
            .attr("class", "new-node-boundary")
            .attr("id", id)
            .attr("x", x)
            .attr("y", y1)
            .attr("width", width)
            .attr("height", y2 - y1 + 20);
        group
            .append("line")
            .attr("class", "branch new-branch")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);
        group
            .append("circle")
            .attr("class", "node new-node")
            .attr("r", 20)
            .attr("cx", x2)
            .attr("cy", y2);
    };

    /**
     * Draw the input element so user can edit node values in the diagram.
     * It will be positioned on top of the node.
     * @param {EventTarget} target - The event target of the node clicked.
     */
    const drawEditNodeValueField = (target) => {
        const rect = target.getBoundingClientRect();
        const inputContainer = d3
            .select("#svg-container")
            .append("div")
            .attr("class", "edit-value-container")
            .style("position", "absolute")
            .style("width", rect.width + "px")
            .style("height", rect.height + "px")
            .style("left", rect.x + "px")
            .style("top", rect.y + "px");

        const path = target.id;
        const currValue = TreeNode.traverse(binaryTreeRoot, path).val;

        const input = inputContainer
            .append("input")
            .attr("class", "edit-value-input");
        input.node().focus();
        input.node().value = currValue;
        input.node().select();

        /**
         * User presses enter -> update node value.
         * User presses escape -> node value is NOT updated.
         */
        let userEscaped = false;
        input.on("keyup", (e) => {
            if (e.key === "Enter") {
                input.node().blur();
            } else if (e.key === "Esc") {
                userEscaped = true;
                input.node().blur();
            }
        });
        /* User clicks outside of field -> update node value */
        input.on("blur", () => {
            let newValue = userEscaped ? currValue : input.node().value;
            /* parse the new value as a number, if it can be */
            if (!isNaN(newValue) && newValue !== "") {
                newValue = parseFloat(newValue);
            }
            TreeNode.traverse(binaryTreeRoot, path).val = newValue;
            inputContainer.remove();
            updateTreeArray(binaryTreeRoot);
            renderTreeGraphic(binaryTreeRoot);
        });
    };

    /**
     * This function scales the tree when it is too large to fit on the screen.
     * It also moves the tree horizontally so it is centered on the page.
     * @param {SVGElement} tree - The <g> inside the <svg> element.
     * @param {SVGElement} display  The <svg> element.
     */
    const transformTreeSVG = (tree, display) => {
        let treeRect = tree.node().getBoundingClientRect();
        const displayRect = display.node().getBoundingClientRect();

        /* calculate scale */
        let scale = 1;
        if (treeRect.width > displayRect.width) {
            scale = Math.max((displayRect.width / treeRect.width) * 0.95, 0.5); // minimum scale hard-coded to 0.5
        }
        tree.attr("transform", `scale(${scale})`);

        /* Now that the tree is scaled, get its updated bounding box */
        treeRect = tree.node().getBoundingClientRect();

        /* Center the tree horizontally with respect to the <svg> element */
        const treeCenter = treeRect.x + treeRect.width / 2;
        const displayCenter = displayRect.x + displayRect.width / 2;
        tree.attr(
            "transform",
            `translate(${displayCenter - treeCenter}, 0) scale(${scale})`
        );
    };

    /**
     * Generate a random binary tree. The values will be generated by the
     * callback function.
     * @param {*} callback - Value generator function.
     * @returns {TreeNode} - Root of binary tree.
     */
    const randomBinaryTree = (callback) => {
        const root = new TreeNode(callback());
        const rootCopy = root;

        const queue = [[root, 1]];
        while (queue.length > 0) {
            const [node, depth] = queue.shift();
            if (
                Math.random() < $optionLeftChildProb.value &&
                depth < maxTreeDepth
            ) {
                node.left = new TreeNode(valueGenerator());
                queue.push([node.left, depth + 1]);
            }
            if (
                Math.random() < $optionRightChildProb.value &&
                depth < maxTreeDepth
            ) {
                node.right = new TreeNode(valueGenerator());
                queue.push([node.right, depth + 1]);
            }
        }
        return rootCopy;
    };

    /**
     * Returns a value based on the currently selected
     * 'New Node Value' option in the options menu.
     * @returns {String|Number} - The random (or fixed) value.
     */
    const valueGenerator = () => {
        /* Radio button selection in options menu */
        const radio = document.querySelector(
            'input[name="new-node-choice"]:checked'
        ).value;
        if (radio === "fixed-val") {
            return $optionFixedVal.value; // input field value
        } else if (radio === "random-string") {
            return Math.random().toString(36).slice(2, 5); // 3-char alphanumeric string
        } else {
            return Math.floor(Math.random() * 100); // random number 0-99
        }
    };

    /**
     * Add the <svg> element the <g> element to the DOM.
     * Using DS.js library to manipulate SVG elements in the DOM. (https://d3js.org/)
     */
    d3.select("#svg-container")
        .append("svg")
        .attr("id", "svg-display")
        .append("g")
        .attr("id", "svg-tree");

    /* Get DOM elements: main input and buttons */
    const $treeArrayInput = document.getElementById("tree-array-input");
    const $arrayToTreeButton = document.getElementById("array-to-tree");
    const $randomTreeButton = document.getElementById("random-tree");

    /* Get DOM elements: collapsible menus */
    const $menuItems = document.querySelectorAll(".menu-bar-list-item");
    const $expandIcons = document.querySelectorAll(".expand-icon");
    const $collapsibles = document.querySelectorAll(".collapsible");

    /* Get DOM elements: alert (error message) container */
    const $alertContainer = document.getElementById("alert-container");

    /* Get DOM elements: example tree buttons container */
    const $examplesContainer = document.getElementById("examples-container");

    /* Get DOM elements: options menu elements */
    const $optionFixedVal = document.getElementById("new-node-fixed-val");
    const $optionColoredLeafs = document.getElementById("option-colored-leafs");
    const $optionShowAddNode = document.getElementById("option-show-add-node");
    const $optionMaxTreeDepth = document.getElementById("max-tree-depth");
    const $optionLeftChildProb = document.getElementById(
        "left-child-probability"
    );
    const $optionRightChildProb = document.getElementById(
        "right-child-probability"
    );

    /* Event Listeners for changing options */
    $optionColoredLeafs.addEventListener("change", () => {
        if ($optionColoredLeafs.checked) {
            document
                .querySelectorAll(".leaf")
                .forEach((e) => e.classList.add("colored"));
        } else {
            document
                .querySelectorAll(".leaf")
                .forEach((e) => e.classList.remove("colored"));
        }
    });
    $optionShowAddNode.addEventListener("change", () => {
        if ($optionShowAddNode.checked) {
            document
                .querySelectorAll(".new-node-area")
                .forEach((e) => e.classList.add("visible"));
        } else {
            document
                .querySelectorAll(".new-node-area")
                .forEach((e) => e.classList.remove("visible"));
        }
    });
    $optionMaxTreeDepth.addEventListener("change", () => {
        maxTreeDepth = parseInt($optionMaxTreeDepth.value);
        renderTreeGraphic(binaryTreeRoot);
    });

    /* Event Listener for main input field and buttons */
    $treeArrayInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            $treeArrayInput.blur(); // prevents a carriage return from actually being input
            binaryTreeRoot = buildTreeFromArrString($treeArrayInput.innerText);
            renderTreeGraphic(binaryTreeRoot);
        }
    });
    $arrayToTreeButton.addEventListener("click", () => {
        binaryTreeRoot = buildTreeFromArrString($treeArrayInput.innerText);
        renderTreeGraphic(binaryTreeRoot);
    });

    $randomTreeButton.addEventListener("click", () => {
        binaryTreeRoot = randomBinaryTree(valueGenerator); // max depth limit
        updateTreeArray(binaryTreeRoot);
        renderTreeGraphic(binaryTreeRoot);
    });

    /* Toggle 'active' class of menuItems, 'expand more' icons, and collapsible containers.
	Only one menu can be active at a time. */
    $menuItems.forEach(($menuItem, i) => {
        $menuItem.addEventListener("click", () => {
            const alreadyIsActive = $menuItem.classList.contains("active");
            $menuItems.forEach(($menuItem) =>
                $menuItem.classList.remove("active")
            );
            $expandIcons.forEach(($expandIcon) =>
                $expandIcon.classList.remove("active")
            );
            $collapsibles.forEach(($collapsible) =>
                $collapsible.classList.remove("active")
            );
            if (!alreadyIsActive) {
                $menuItem.classList.add("active");
                $expandIcons[i].classList.add("active");
                $collapsibles[i].classList.add("active");
            }
        });
    });

    /* Example trees to visualize different traversal methods */
    const exampleTrees = [
        { name: "null", serializedArray: "[]" },
        {
            name: "Values in Inorder Traversal",
            serializedArray: "[6,4,8,2,5,7,10,1,3,null,null,null,null,9,11]",
        },
        {
            name: "Values in Preorder Traversal",
            serializedArray: "[1,2,7,3,6,8,9,4,5,null,null,null,null,10,11]",
        },
        {
            name: "Values in Postorder Traversal",
            serializedArray: "[11,5,10,3,4,6,9,1,2,null,null,null,null,7,8]",
        },
        {
            name: "Values in Level-Order Traversal",
            serializedArray: "[1,2,3,4,5,6,7,8,9,null,null,null,null,10,11]",
        },
    ];

    /* Add example tree buttons to DOM */
    $examplesContainer.innerHTML = exampleTrees.reduce((acc, e) => {
        return acc + `<button class="example-tree">${e.name}</button>`;
    }, "");

    /* Event delegation for example tree buttons */
    $examplesContainer.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") return;
        const example = exampleTrees.find(
            (el) => el.name === e.target.innerText
        );
        binaryTreeRoot = buildTreeFromArrString(example.serializedArray);
        updateTreeArray(binaryTreeRoot);
        renderTreeGraphic(binaryTreeRoot);
    });

    /* Redraw diagram when user resizes window */
    let throttled = false;
    let delay = 250; // milliseconds
    window.addEventListener("resize", () => {
        if (!throttled) {
            renderTreeGraphic(binaryTreeRoot);
            throttled = true;
            setTimeout(() => {
                throttled = false;
            }, delay);
        }
    });

    /* GLOBAL VARIABLES */
    const minNodeSpacing = 50; // Pixel distance (x) between nodes at the bottom of the tree.
    const dy = 100; // Pixel distance (y) between each level of the tree.
    let binaryTreeRoot = null; // The variable that stores the binary tree is is rendered.
    let maxTreeDepth = parseInt($optionMaxTreeDepth.value); // User-controlled maximum depth of binary tree.

    /* Set the default tree when the page loads. */
    $treeArrayInput.innerText = "[4,8,15,16,23,null,42]";
    binaryTreeRoot = buildTreeFromArrString($treeArrayInput.innerText);
    renderTreeGraphic(binaryTreeRoot);
};

startApp();
