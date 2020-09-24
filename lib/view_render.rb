# frozen_string_literal: true
require 'tmpdir'

if !$VIEW_PATH_MODIFIED
  ApplicationController.append_view_path(Dir.tmpdir)
  $VIEW_PATH_MODIFIED = true
end

options   = JSON.parse(STDIN.read)
delimiter = options['delimiter']
resource  = options['resource']
layout    = options['layout']
variant   = options['variant']
source    = options['source']

url   = URI.parse(resource)
query = URI.decode_www_form(url.query.to_s).to_h

lang = query['lang'] || url.path.split('.')[1..-1].join('.')

tmp_file = Tempfile.new(["tmp_view", ".#{lang}"])
tmp_file.write(source)
tmp_file.flush

layout  ||= query['layout'] || false
variant ||= query['variant']

output = ApplicationController.render(template: File.basename(tmp_file.path), layout: layout, variant: variant)
tmp_file.unlink
puts "#{delimiter}#{output}#{delimiter}"
