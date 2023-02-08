import { isSelection } from '@uwdata/mosaic-core';
import { eq, literal } from '@uwdata/mosaic-sql';
import { select, pointer } from 'd3';

export class NearestSelection {
  constructor(mark, {
    selection,
    channel,
    field
  }) {
    this.mark = mark;
    this.selection = selection;
    this.clients = new Set().add(mark);
    this.channel = channel;
    this.field = field || mark.channelField(channel);
    this.field = this.field?.column || this.field;
  }

  clause(value) {
    const { clients, field } = this;
    const predicate = value ? eq(field, literal(value)) : null;
    return {
      source: this,
      schema: { type: 'point' },
      clients,
      value,
      predicate
    };
  }

  init(svg) {
    const that = this;
    const { mark, channel, selection } = this;
    const { data } = mark;

    const facets = select(svg).selectAll('g[aria-label="facet"]');
    const root = facets.size() ? facets : select(svg);
    const scale = svg.scale(channel);
    const param = !isSelection(selection);

    root.on('mousemove', function(evt) {
      const [x, y] = pointer(evt, this);
      const z = findNearest(data, channel, scale.invert(channel === 'x' ? x : y));
      selection.update(param ? z : that.clause(z));
    });

    if (param) return;
    svg.addEventListener('mouseenter', () => {
      this.selection.activate(this.clause(0));
    });
  }
}

function findNearest(data, key, value) {
  let dist = Infinity;
  let v;
  data.forEach(d => {
    const delta = Math.abs(d[key] - value);
    if (delta < dist) {
      dist = delta;
      v = d[key];
    }
  });
  return v;
}
