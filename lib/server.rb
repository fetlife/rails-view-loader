require 'sinatra/base'
require 'rack/handler/puma'
require 'tmpdir'

ApplicationController.append_view_path(Dir.tmpdir)

class RailsViewLoaderServer < Sinatra::Base
  configure :production, :development do
    enable :logging
    set(:show_exceptions, false)
  end

  error do
    content_type :json
    e = env['sinatra.error']
    {:result => 'error', :message => e.message}.to_json
  end

  post '/' do
    request.body.rewind  # in case someone already read it
    options = JSON.parse(request.body.read)
    resource  = options['resource']
    layout    = options['layout']
    variant   = options['variant']
    source    = options['source']

    url   = URI.parse(resource)
    query = URI.decode_www_form(url.query.to_s).to_h

    lang = query['lang'] || url.path.split('.')[1..-1].join('.')

    layout  ||= query['layout'] || false
    variant ||= query['variant']

    output = ApplicationController.render(inline: source, type: lang, layout: layout, variant: variant)
    output
  end
end

port = ARGV[0] || "4567"
host = ARGV[1] || "127.0.0.1"

Rack::Handler::Puma.run(RailsViewLoaderServer, { Host: host, Port: port })
