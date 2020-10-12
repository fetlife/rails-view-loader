require 'rack/handler/puma'
require 'tmpdir'

class RailsViewTemplateRendering < ActionController::Metal
  include AbstractController::Rendering
  include ActionView::Layouts

  def index
    append_view_path(Dir.tmpdir)
    resource  = params['resource']
    layout    = params['layout']
    variant   = params['variant']
    source    = params['source']

    url   = URI.parse(resource)
    query = URI.decode_www_form(url.query.to_s).to_h

    lang = query['lang'] || url.path.split('.')[1..-1].join('.')

    layout  ||= query['layout'] || false
    variant ||= query['variant']

    render(
      inline: source,
      type: lang,
      layout: layout,
      variant: variant,
    )
  end
end

port = ARGV[0] || "4567"
host = ARGV[1] || "127.0.0.1"

Rack::Handler::Puma.run(RailsViewTemplateRendering.action(:index), { Host: host, Port: port })
