import $ from 'jquery';
import lists from '../core/lists';
import func from '../core/func';
import dom from '../core/dom';
import range from '../core/range';

export default class Bullet {
  /**
   * toggle ordered list
   */
  insertOrderedList(editable) {
    this.toggleList('OL', editable);
  }

  /**
   * toggle unordered list
   */
  insertUnorderedList(editable) {
    this.toggleList('UL', editable);
  }


  insertTodoList(editable){
    this.toggleList('CL', editable);
  }

  /**
   * indent
   */
  indent(editable) {
    const rng = range.create(editable).wrapBodyInlineWithPara();

    const paras = rng.nodes(dom.isPara, { includeAncestor: true });
    const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));

    $.each(clustereds, (idx, paras) => {
      const head = lists.head(paras);
      if (dom.isLi(head)) {
        const previousList = this.findList(head.previousSibling);
        if (previousList) {
          paras
            .map(para => previousList.appendChild(para));
        } else {
          this.wrapList(paras, head.parentNode.nodeName);
          paras
            .map((para) => para.parentNode)
            .map((para) => this.appendToPrevious(para));
        }
      } else {
        $.each(paras, (idx, para) => {
          $(para).css('marginLeft', (idx, val) => {
            return (parseInt(val, 10) || 0) + 25;
          });
        });
      }
    });

    rng.select();
  }

  /**
   * outdent
   */
  outdent(editable) {
    const rng = range.create(editable).wrapBodyInlineWithPara();

    const paras = rng.nodes(dom.isPara, { includeAncestor: true });
    const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));

    $.each(clustereds, (idx, paras) => {
      const head = lists.head(paras);
      if (dom.isLi(head)) {
        this.releaseList([paras]);
      } else {
        $.each(paras, (idx, para) => {
          $(para).css('marginLeft', (idx, val) => {
            val = (parseInt(val, 10) || 0);
            return val > 25 ? val - 25 : '';
          });
        });
      }
    });

    rng.select();
  }

  /**
   * toggle list
   *
   * @param {String} listName - OL or UL
   */
  toggleList(listName, editable) {
    const rng = range.create(editable).wrapBodyInlineWithPara();

    let paras = rng.nodes(dom.isPara, { includeAncestor: true });
    //const bookmark = rng.paraBookmark(paras);
    const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));
    var y,z;
    // paragraph to list
    if (lists.find(paras, dom.isPurePara)) {
      let wrappedParas = [];
      $.each(clustereds, (idx, paras) => {
        wrappedParas = wrappedParas.concat(this.wrapList(paras, listName));
      });
      paras = wrappedParas;
    // list to paragraph or change list style
    } else {
      if(listName=="CL"){
        var lis = editable.getElementsByTagName("LI");
        for(var i=0;i<lis.length;i++){
          y = document.createElement("DIV");
          y.classList.add("list-bullet");
          y.setAttribute("style","display:inline-block;");
          y.addEventListener("click",dom.anish,true);
          lis[i].appendChild(y);
          z = document.createElement("DIV");
          z.id="anish";
          z.innerHTML = "<br/>";
          lis[i].appendChild(z);
          lis[i].setAttribute("style","list-style-type:none");
          var e = editable.getElementsByTagName("OL").length;
          if(e!=0){
            console.log("IN YES");
            var d = document.createElement("UL");
            d.innerHTML = editable.getElementsByTagName("OL")[0].innerHTML;
            editable.getElementsByTagName("OL")[0].parentNode.replaceChild(d,editable.getElementsByTagName("OL")[0]); 
          }
        }
      }
      else{
        console.log("listName",listName);
        const diffLists = rng.nodes(dom.isList, {
          includeAncestor: true,
        }).filter((listNode) => {
          return !$.nodeName(listNode, listName);
        });
        var li = editable.getElementsByTagName("LI");
        console.log("li",li);
        for(i=0;i<li.length;i++){
          li[i].style.listStyleType = "";
        }
        var lis1 = editable.getElementsByTagName("DIV");
        for(var j=0;j<lis1.length;j++){
          console.log("lis1",lis1[j]);
          lis1[j].remove();
        }
        var c = editable.getElementsByTagName("UL")[0];
        if(editable.getElementsByTagName("UL").length!=0 && listName=="OL"){
          var t = document.createElement("OL");
          t.innerHTML = c.innerHTML;
          editable.getElementsByTagName("UL")[0].parentNode.replaceChild(t,c);
        }
        if (diffLists.length) {
          $.each(diffLists, (idx, listNode) => {
            dom.replace(listNode, listName);
          });
        } else {
          paras = this.releaseList(clustereds, true);
        }
      }
      
    }
    //console.log("Range",range.createFromParaBookmark(bookmark, paras).select());

    //range.createFromParaBookmark(bookmark, paras).select();
  }




  /**
   * @param {Node[]} paras
   * @param {String} listName
   * @return {Node[]}
   */
  wrapList(paras, listName) {
    const head = lists.head(paras);
    const last = lists.last(paras);

    const prevList = dom.isList(head.previousSibling) && head.previousSibling;
    const nextList = dom.isList(last.nextSibling) && last.nextSibling;
    if(listName=="CL"){
      console.log("In cl");
      const listNode = prevList || dom.insertAfter(dom.create(listName || 'UL'), last , "1");
      // P to LI
      paras = paras.map((para) => {
        return dom.isPurePara(para) ? dom.replace(para, 'LI') : para;
      });
      dom.appendChildNodes(listNode, paras);
      if (nextList) {
        dom.appendChildNodes(listNode, lists.from(nextList.childNodes));
        dom.remove(nextList);
      }

      return paras;
    }
    else{
      const listNode = prevList || dom.insertAfter(dom.create(listName || 'UL'), last, "0");
      paras = paras.map((para) => {
        return dom.isPurePara(para) ? dom.replace(para, 'LI') : para;
      });
      dom.appendChildNodes(listNode, paras);

      if (nextList) {
        dom.appendChildNodes(listNode, lists.from(nextList.childNodes));
        dom.remove(nextList);
      }

      return paras;
    }

    // // P to LI
    // paras = paras.map((para) => {
    //   return dom.isPurePara(para) ? dom.replace(para, 'LI') : para;
    // });

    // // append to list(<ul>, <ol>)
    // dom.appendChildNodes(listNode, paras);

    // if (nextList) {
    //   dom.appendChildNodes(listNode, lists.from(nextList.childNodes));
    //   dom.remove(nextList);
    // }

    // return paras;
  }

  /**
   * @method releaseList
   *
   * @param {Array[]} clustereds
   * @param {Boolean} isEscapseToBody
   * @return {Node[]}
   */
  releaseList(clustereds, isEscapseToBody) {
    let releasedParas = [];

    $.each(clustereds, (idx, paras) => {
      const head = lists.head(paras);
      const last = lists.last(paras);

      const headList = isEscapseToBody ? dom.lastAncestor(head, dom.isList) : head.parentNode;
      const parentItem = headList.parentNode;

      if (headList.parentNode.nodeName === 'LI') {
        paras.map(para => {
          const newList = this.findNextSiblings(para);

          if (parentItem.nextSibling) {
            parentItem.parentNode.insertBefore(
              para,
              parentItem.nextSibling
            );
          } else {
            parentItem.parentNode.appendChild(para);
          }

          if (newList.length) {
            this.wrapList(newList, headList.nodeName);
            para.appendChild(newList[0].parentNode);
          }
        });

        if (headList.children.length === 0) {
          parentItem.removeChild(headList);
        }

        if (parentItem.childNodes.length === 0) {
          parentItem.parentNode.removeChild(parentItem);
        }
      } else {
        const lastList = headList.childNodes.length > 1 ? dom.splitTree(headList, {
          node: last.parentNode,
          offset: dom.position(last) + 1,
        }, {
          isSkipPaddingBlankHTML: true,
        }) : null;

        const middleList = dom.splitTree(headList, {
          node: head.parentNode,
          offset: dom.position(head),
        }, {
          isSkipPaddingBlankHTML: true,
        });

        paras = isEscapseToBody ? dom.listDescendant(middleList, dom.isLi)
          : lists.from(middleList.childNodes).filter(dom.isLi);

        // LI to P
        if (isEscapseToBody || !dom.isList(headList.parentNode)) {
          paras = paras.map((para) => {
            return dom.replace(para, 'P');
          });
        }

        $.each(lists.from(paras).reverse(), (idx, para) => {
          dom.insertAfter(para, headList,"0");
        });

        // remove empty lists
        const rootLists = lists.compact([headList, middleList, lastList]);
        $.each(rootLists, (idx, rootList) => {
          const listNodes = [rootList].concat(dom.listDescendant(rootList, dom.isList));
          $.each(listNodes.reverse(), (idx, listNode) => {
            if (!dom.nodeLength(listNode)) {
              dom.remove(listNode, true);
            }
          });
        });
      }

      releasedParas = releasedParas.concat(paras);
    });

    return releasedParas;
  }

  /**
   * @method appendToPrevious
   *
   * Appends list to previous list item, if
   * none exist it wraps the list in a new list item.
   *
   * @param {HTMLNode} ListItem
   * @return {HTMLNode}
   */
  appendToPrevious(node) {
    return node.previousSibling
      ? dom.appendChildNodes(node.previousSibling, [node])
      : this.wrapList([node], 'LI');
  }

  /**
   * @method findList
   *
   * Finds an existing list in list item
   *
   * @param {HTMLNode} ListItem
   * @return {Array[]}
   */
  findList(node) {
    return node
      ? lists.find(node.children, child => ['OL', 'UL'].indexOf(child.nodeName) > -1)
      : null;
  }

  /**
   * @method findNextSiblings
   *
   * Finds all list item siblings that follow it
   *
   * @param {HTMLNode} ListItem
   * @return {HTMLNode}
   */
  findNextSiblings(node) {
    const siblings = [];
    while (node.nextSibling) {
      siblings.push(node.nextSibling);
      node = node.nextSibling;
    }
    return siblings;
  }
}