import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Reader, {
  Connector,
  selectReaderCurrentContentIndex,
  selectReaderSetting,
  ViewType,
  load,
  unload,
  SelectionMode,
  selectReaderIsReadyToRead,
  ReaderJsHelper,
  EventBus,
  Events,
} from '@ridi/react-viewer';
import { selectAnnotations, selectContextMenu } from '../../redux/Viewer.selector';
import ViewerScreenFooter from '../footers/ViewerScreenFooter';
import {
  requestLoadContent,
  addAnnotation,
  setAnnotations,
  updateAnnotation, removeAnnotation, setContextMenu, onScreenScrolled,
} from '../../redux/Viewer.action';
import { screenHeight, screenWidth } from '../../utils/BrowserWrapper';
import Cache from '../../utils/Cache';
import { Position } from '../../constants/ViewerConstants';
import SelectionContextMenu from '../selection/SelectionContextMenu';

class ViewerBody extends React.Component {
  constructor(props) {
    super(props);
    this.readerCache = new Cache(
      props.contentMeta.id,
      key => `${key}_${screenWidth()}x${screenHeight()}_${Connector.setting.getSetting().viewType}`,
    );
    this.annotationCache = new Cache(props.contentMeta.id);

    this.onReaderLoaded = this.onReaderLoaded.bind(this);
    this.onReaderUnloaded = this.onReaderUnloaded.bind(this);
    this.onContentMenuItemClicked = this.onContentMenuItemClicked.bind(this);
    this.onReaderSelectionChanged = this.onReaderSelectionChanged.bind(this);
    this.onReaderAnnotationTouched = this.onReaderAnnotationTouched.bind(this);

    EventBus.on(Events.core.SCROLL, this.onReaderScrolled.bind(this));
    EventBus.on(Events.core.TOUCH, this.onReaderTouched.bind(this));

    this.footer = <ViewerScreenFooter contentMeta={props.contentMeta} />;
    this.contentFooter = <small>content footer area...</small>;
  }

  componentDidUpdate(prevProps) {
    const { isReadyToRead, actionSetContextMenu } = this.props;
    if (prevProps.isReadyToRead && !isReadyToRead) {
      actionSetContextMenu(false);
    }
  }

  onReaderLoaded() {
    const {
      contentMeta,
      actionLoad,
      actionRequestLoadContent,
      actionSetAnnotations,
    } = this.props;
    const readerState = this.readerCache.get();
    if (readerState) {
      actionLoad(readerState);
    } else {
      actionRequestLoadContent(contentMeta);
    }
    const annotationsState = this.annotationCache.get();
    if (annotationsState) {
      actionSetAnnotations(annotationsState);
    }
  }

  onReaderUnloaded() {
    const {
      actionUnload,
      annotations,
    } = this.props;
    if (!Connector.core.isReaderLoaded() || !Connector.core.isReaderAllCalculated()) return;
    const currentState = Connector.core.getReaderState();
    this.readerCache.set(currentState);

    this.annotationCache.set(annotations);

    actionUnload();
  }

  onReaderScrolled() {
    const { actionOnScreenScrolled } = this.props;
    actionOnScreenScrolled();
  }

  onReaderTouched(event) {
    const link = ReaderJsHelper.getCurrent().content.getLinkFromElement(event.detail.target);
    if (link) {
      // TODO go to...
      return;
    }
    const { setting, onTouched } = this.props;

    const width = screenWidth();
    let position = Position.MIDDLE;
    if (setting.viewType === ViewType.PAGE) {
      if (event.detail.clientX <= width * 0.2) position = Position.LEFT;
      if (event.detail.clientX >= width * 0.8) position = Position.RIGHT;
    }
    onTouched(position);
  }

  onContentMenuItemClicked(targetSelection) {
    const {
      currentContentIndex,
      actionAddAnnotation,
      actionSetAnnotation,
      actionRemoveAnnotation,
      actionSetContextMenu,
    } = this.props;
    const {
      id,
      style,
      withHandle,
      ...others
    } = targetSelection;
    const updateSelection = {
      id,
      ...others,
      contentIndex: currentContentIndex,
      style,
    };
    if (!id) {
      actionAddAnnotation(updateSelection);
    } else if (!style) {
      actionRemoveAnnotation(updateSelection);
    } else if (style) {
      actionSetAnnotation(updateSelection);
    }
    Connector.selection.end();
    actionSetContextMenu(false);
  }

  onReaderAnnotationTouched(annotation) {
    const { actionSetContextMenu } = this.props;
    actionSetContextMenu(true, annotation);
  }

  onReaderSelectionChanged({ selection, selectionMode }) {
    const {
      currentContentIndex,
      actionAddAnnotation,
      actionSetContextMenu,
    } = this.props;

    if (selectionMode === SelectionMode.USER_SELECTION) {
      return actionSetContextMenu(true, selection);
    }
    if (selectionMode === SelectionMode.AUTO_HIGHLIGHT) {
      actionAddAnnotation({ ...selection, contentIndex: currentContentIndex });
      Connector.selection.end();
      return actionSetContextMenu(false);
    }
    return actionSetContextMenu(false);
  }

  renderPageButtons() {
    const { setting } = this.props;
    if (setting.viewType === ViewType.SCROLL) return null;
    return (
      <>
        <button type="button" className="left_button" />
        <button type="button" className="right_button" />
      </>
    );
  }

  renderContextMenu() {
    const { isVisible, target } = this.props.contextMenu;
    if (!isVisible) return null;

    const lastRect = target.rects.length > 0 ? target.rects[target.rects.length - 1] : null;
    return (
      <SelectionContextMenu
        top={lastRect.top + lastRect.height}
        left={lastRect.left + lastRect.width}
        targetItem={target}
        onClickItem={this.onContentMenuItemClicked}
      />
    );
  }

  render() {
    const { annotations } = this.props;
    return (
      <>
        <Reader
          footer={this.footer}
          contentFooter={this.contentFooter}
          onMount={this.onReaderLoaded}
          onUnmount={this.onReaderUnloaded}
          selectable
          annotationable
          annotations={annotations}
          onSelectionChanged={this.onReaderSelectionChanged}
          onAnnotationTouched={this.onReaderAnnotationTouched}
        />
        { this.renderContextMenu() }
      </>
    );
  }
}

ViewerBody.propTypes = {
  contentMeta: PropTypes.object.isRequired,
  onTouched: PropTypes.func.isRequired,
  currentContentIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  actionRequestLoadContent: PropTypes.func.isRequired,
  setting: PropTypes.object.isRequired,
  actionLoad: PropTypes.func.isRequired,
  actionUnload: PropTypes.func.isRequired,
  annotations: PropTypes.array.isRequired,
  actionAddAnnotation: PropTypes.func.isRequired,
  actionSetAnnotations: PropTypes.func.isRequired,
  actionSetAnnotation: PropTypes.func.isRequired,
  actionRemoveAnnotation: PropTypes.func.isRequired,
  contextMenu: PropTypes.object.isRequired,
  actionSetContextMenu: PropTypes.func.isRequired,
  isReadyToRead: PropTypes.bool.isRequired,
  actionOnScreenScrolled: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  isVisibleSettingPopup: state.viewer.ui.isVisibleSettingPopup,
  currentContentIndex: selectReaderCurrentContentIndex(state),
  setting: selectReaderSetting(state),
  annotations: selectAnnotations(state),
  contextMenu: selectContextMenu(state),
  isReadyToRead: selectReaderIsReadyToRead(state),
});

const mapDispatchToProps = dispatch => ({
  actionRequestLoadContent: contentMeta => dispatch(requestLoadContent(contentMeta)),
  actionLoad: state => dispatch(load(state)),
  actionUnload: () => dispatch(unload()),
  actionAddAnnotation: annotation => dispatch(addAnnotation(annotation)),
  actionSetAnnotations: annotations => dispatch(setAnnotations(annotations)),
  actionSetAnnotation: annotation => dispatch(updateAnnotation(annotation)),
  actionRemoveAnnotation: annotation => dispatch(removeAnnotation(annotation)),
  actionSetContextMenu: (isVisible, target) => dispatch(setContextMenu(isVisible, target)),
  actionOnScreenScrolled: () => dispatch(onScreenScrolled()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ViewerBody);