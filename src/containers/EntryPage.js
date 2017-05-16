import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import history from '../routing/history';
import {
  loadEntry,
  createDraftFromEntry,
  createEmptyDraft,
  discardDraft,
  changeDraftField,
  changeDraftFieldValidation,
  persistEntry,
} from '../actions/entries';
import { closeEntry } from '../actions/editor';
import { addAsset, removeAsset } from '../actions/media';
import { openSidebar } from '../actions/globalUI';
import { selectEntry, getAsset } from '../reducers';
import { selectFields } from '../reducers/collections';
import EntryEditor from '../components/EntryEditor/EntryEditor';
import entryPageHOC from './EntryPageHOC';
import { Loader } from '../components/UI';

class EntryPage extends React.Component {
  static propTypes = {
    addAsset: PropTypes.func.isRequired,
    boundGetAsset: PropTypes.func.isRequired,
    changeDraftField: PropTypes.func.isRequired,
    changeDraftFieldValidation: PropTypes.func.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
    createDraftFromEntry: PropTypes.func.isRequired,
    createEmptyDraft: PropTypes.func.isRequired,
    discardDraft: PropTypes.func.isRequired,
    entry: ImmutablePropTypes.map,
    entryDraft: ImmutablePropTypes.map.isRequired,
    loadEntry: PropTypes.func.isRequired,
    persistEntry: PropTypes.func.isRequired,
    removeAsset: PropTypes.func.isRequired,
    closeEntry: PropTypes.func.isRequired,
    openSidebar: PropTypes.func.isRequired,
    fields: ImmutablePropTypes.list.isRequired,
    slug: PropTypes.string,
    newEntry: PropTypes.bool.isRequired,
  };

  componentDidMount() {
    const { entry, newEntry, collection, slug, loadEntry, createEmptyDraft } = this.props;
    this.props.openSidebar();
    if (newEntry) {
      createEmptyDraft(collection);
    } else {
      loadEntry(collection, slug);
    }

    // Prompt user before navigating away if the document has been changed
    this.unlisten = history.listenBefore((location) => {
      if (this.props.entryDraft.get('hasChanged')) {
        return "Are you sure you want to leave this page?";
      }
      return true;
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entry === nextProps.entry) {
      return;
    }

    if (nextProps.entry && !nextProps.entry.get('isFetching') && !nextProps.entry.get('error')) {
      this.props.createDraftFromEntry(nextProps.entry);
    } else if (nextProps.newEntry) {
      this.props.createEmptyDraft(nextProps.collection);
    }
  }

  componentWillUnmount() {
    this.props.discardDraft();
    this.unlisten();
  }

  render() {
    const {
      entry,
      entryDraft,
      fields,
      boundGetAsset,
      collection,
      changeDraftField,
      changeDraftFieldValidation,
      addAsset,
      removeAsset,
      persistEntry,
      closeEntry,
    } = this.props;

    if (entry && entry.get('error')) {
      return <div><h3>{ entry.get('error') }</h3></div>;
    }

    if (!entryDraft || entryDraft.get('entry') === undefined || (entry && entry.get('isFetching'))) {
      return <Loader active>Loading entry...</Loader>;
    }

    return (
      <EntryEditor
        entry={entryDraft.get('entry')}
        getAsset={boundGetAsset}
        collection={collection}
        fields={fields}
        fieldsMetaData={entryDraft.get('fieldsMetaData')}
        fieldsErrors={entryDraft.get('fieldsErrors')}
        onChange={changeDraftField}
        onValidate={changeDraftFieldValidation}
        onAddAsset={addAsset}
        onRemoveAsset={removeAsset}
        onPersist={() => setTimeout(() => persistEntry(collection))}
        onCancelEdit={closeEntry}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections, entryDraft } = state;
  const slug = ownProps.params.slug;
  const collection = collections.get(ownProps.params.name);
  const newEntry = ownProps.route && ownProps.route.newRecord === true;
  const fields = selectFields(collection, slug);
  const entry = newEntry ? null : selectEntry(state, collection.get('name'), slug);
  const boundGetAsset = getAsset.bind(null, state);
  return {
    collection,
    collections,
    newEntry,
    entryDraft,
    boundGetAsset,
    fields,
    slug,
    entry,
  };
}

export default connect(
  mapStateToProps,
  {
    changeDraftField,
    changeDraftFieldValidation,
    addAsset,
    removeAsset,
    loadEntry,
    createDraftFromEntry,
    createEmptyDraft,
    discardDraft,
    persistEntry,
    closeEntry,
    openSidebar,
  }
)(entryPageHOC(EntryPage));
